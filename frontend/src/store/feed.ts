/** 创建文章加载流 */
import { defineStore } from "pinia"
import { ref, type Ref } from "vue"
import type { articleData } from '@/types/article'
import type { Comment } from "@/types/comments"
import { getArticle, likeArticle, dislikeArticle, getArticleDetails } from "@/api/articles"
import { useUserStore } from "./user"
import { getOrCreateGuestId } from "@/utils/guest"
import { useMessageStore } from "./message"
import { getAllComment, createComment as apiCreateComment } from "@/api/comments"
import { getArticleLikers } from "@/api/articles"

const messageStore = useMessageStore()
const userStore = useUserStore()
const articleLikesMap = ref<Record<number, any[]>>({})
const commentsMap = ref<Record<number, Comment[]>>({})


export const useFeedStore = defineStore('feed', () => {
    const articles = ref<articleData[]>([])
    const page = ref(0)
    const isLoading = ref(false)
    const hasMore = ref(true)
    const commentPagination = ref<Record<string, {
        page: number
        pageSize: number
        total: number
        hasMore: boolean
        isLoading: boolean
        remaining: number
    }>>({})

    const fetchSingleArticle = async (articleId: number) =>  {
        try {
            const article = articles.value.find(a => a.id === articleId)
            if (!article) {
                const guestId = !userStore.token ? getOrCreateGuestId() : undefined
                const response = await getArticleDetails(articleId, guestId)
                articles.value.push(response.data)
            }
        } catch (error) {
            console.error(`获取文章 ${articleId}失败`, error);
        }
    }
    // 点赞用户列表
    const fetchArticleLikers = async (articleId: number) => {
        try {
            const res = await getArticleLikers(articleId)
            articleLikesMap.value[articleId] = res.data
        } catch (error) {
            console.error(`获取文章 ${articleId} 的点赞人列表失败:`, error)
        }
    }

    // 加载初始文章
    const fetchInitialArticles = async () => {
        // if (articles.value.length > 0) return //防止重复加载文章
        isLoading.value = true
        try {
            const guestId = !userStore.token ? getOrCreateGuestId() : undefined;

            const response = await getArticle({ page: 1, pageSize: 5 }, guestId)
            articles.value = response.data.data
            page.value = 1
            hasMore.value = articles.value.length < response.data.total
            return true
        } catch (error) {
            console.error('获取初始文章失败：', error)
            return false
        } finally {
            isLoading.value = false
        }
    }
    // 加载更多文章
    const fetchMoreArticles = async () => {
        // 如果正在加载或文章没有更多，直接返回
        if (isLoading.value || !hasMore.value) return { status: 0 }

        isLoading.value = true
        try {
            const nextPage = page.value + 1
            const guestId = !userStore.token ? getOrCreateGuestId() : undefined;
            const response = await getArticle({ page: nextPage, pageSize: 5 }, guestId)

            // 将新文章数据放入articles数组中
            if (response.data.data.length > 0) {
                // articles.value.push(...response.data.data)
                const existingIds = new Set(articles.value.map((a: articleData) => a.id));
                // 使用existingIds.has(a.id)判断每一个a.id是否包含在articles数组内，filter将为真的结果返回
                const newArticles = response.data.data.filter((a: articleData) => !existingIds.has(a.id));

                articles.value.push(...newArticles);
                page.value += 1

                hasMore.value = articles.value.length < response.data.total
                return { status: 1 }
            }
        } catch (error) {
            console.error('获取更多文章失败:', error)
            return { status: 2, error }
        } finally {
            isLoading.value = false
        }
    }

    // 点赞处理
    const toggleLike = async (articleId: number) => {
        // 本地查找文章
        const article = articles.value.find(a => a.id === articleId)
        if (!article) {
            console.error(`未在 Store 中找到 ID 为 ${articleId} 的文章`);
            return
        }

        //修改本地状态
        const originalIsLiked = article.isLiked
        const originalLikeCount = article.like_count

        if (originalIsLiked) {
            article.isLiked = false
            article.like_count--
        } else {
            article.isLiked = true
            article.like_count++
        }

        // 修改数据库中
        const id: Ref<number> = ref(1);
        try {
            if (userStore.token) {
                // 用户
                if (article.isLiked) {
                    id.value = messageStore.show('正在点赞', 'loading')
                    await likeArticle(articleId)
                    messageStore.update(id.value, { text: '点赞成功', type: 'success', duration: 2000 })
                } else {
                    id.value = messageStore.show('正在取消点赞', 'loading')
                    await dislikeArticle(articleId)
                    messageStore.update(id.value, { text: '取消点赞成功', type: 'success', duration: 2000 })
                }
                await fetchArticleLikers(articleId); // 新增：点赞成功后更新点赞人列表
                return true
            } else {
                // 游客
                const guestId = getOrCreateGuestId()
                if (article.isLiked) {
                    id.value = messageStore.show('正在点赞', 'loading')
                    await likeArticle(articleId, guestId)
                    messageStore.update(id.value, { text: '点赞成功', type: 'success', duration: 2000 })
                } else {
                    id.value = messageStore.show('正在取消点赞', 'loading', 2000)
                    await dislikeArticle(articleId, guestId)
                    messageStore.update(id.value, { text: '取消点赞成功', type: 'success', duration: 2000 })
                }
            }
            return true
        } catch (error: any) {
            console.error(`为文章 ${articleId} 更新点赞状态失败：`, error);
            // 本地状态重置
            article.isLiked = originalIsLiked
            article.like_count = originalLikeCount
            //处理频繁错误
            if (error.response.status === 429) {
                if (id.value !== null) {
                    messageStore.update(id.value, { text: '操作过于频繁，请稍后重试', 'type': 'error', duration: 2000 })
                    return false
                } else {
                    console.error('id 变量为 null，无法传递给函数');
                    messageStore.update(id.value, { text: '操作过于频繁，请稍后重试', 'type': 'error', duration: 2000 })
                    return false
                }
            }
            messageStore.update(id.value, { text: '操作失败，请稍后重试', 'type': 'error', duration: 2000 })
            return false
        }
    }

    // 更新 hasMore 状态
    function updateHasMore(articleId: number, total: number) {
        const currentLength = commentsMap.value[articleId]?.length || 0
        commentPagination.value[articleId].hasMore = currentLength < total
        commentPagination.value[articleId].remaining = total - currentLength
    }
    // 获取文章初始评论
    const fetchInitialComments = async (articleId: number) => {
        const state = commentPagination.value[articleId]
        if (state?.isLoading || state?.page > 0) return

        commentPagination.value[articleId] = {
            page: 1,
            pageSize: 3,
            total: 0,
            hasMore: true,
            isLoading: true,
            remaining: 0
        }
        try {
            const response = await getAllComment(Number(articleId), {
                page: 1,
                pageSize: commentPagination.value[articleId].pageSize
            })
            commentsMap.value[articleId] = response.data.data
            commentPagination.value[articleId].total = response.data.total
            updateHasMore(Number(articleId), response.data.total)
            return true
        } catch (error) {
            console.error('获取初始评论失败：', error);
            return false
        } finally {
            commentPagination.value[articleId].isLoading = false
        }
    }
    // 加载更多文章评论
    const fetchMoreComments = async (articleId: number) => {
        const state = commentPagination.value[articleId]
        if (!state || state.isLoading || !state.hasMore) return

        commentPagination.value[articleId].isLoading = true

        try {
            const nextPage = state.page + 1
            const pageSize = state.pageSize

            const response = await getAllComment(articleId, {
                page: nextPage,
                pageSize,
            })

            if (!commentsMap.value[articleId]) {
                commentsMap.value[articleId] = []
            }

            const existingIds = new Set(commentsMap.value[articleId]?.map(c => c.id))
            const newComments = response.data.data.filter((c: Comment) => !existingIds.has(c.id))

            commentsMap.value[articleId].push(...newComments)
            commentPagination.value[articleId].page = nextPage
            updateHasMore(articleId, response.data.total)
            return true
        } catch (error) {
            console.error('获取更多更多评论失败：', error);
            return false
        } finally {
            commentPagination.value[articleId].isLoading = false
        }
    }

    // 创建评论
    const createComment = async (payload: { articleId: number; content: string; parentId?: string }) => {
        try {
            const res = await apiCreateComment(payload)

            if (res.data) {
                const newComment = res.data; //返回的新文章内容)
                if (!commentsMap.value[payload.articleId]) {
                    commentsMap.value[payload.articleId] = []
                }
                commentsMap.value[payload.articleId].push(newComment)

                const article = articles.value.find(a => a.id === Number(payload.articleId))
                if (article) {
                    article.comment_count++
                }
            }
            return true
        } catch (error) {
            console.error('创建评论失败：', error);
            return false
        }
    }
    // 将数据和方法返回
    return {
        articles,
        isLoading,
        hasMore,
        fetchInitialArticles,
        fetchMoreArticles,
        toggleLike,
        fetchInitialComments,
        fetchMoreComments,
        commentPagination,
        commentsMap,
        createComment,
        fetchArticleLikers,
        articleLikesMap,
        fetchSingleArticle
    }
})