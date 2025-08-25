/** 创建文章加载流 */
import { defineStore } from "pinia"
import { ref } from "vue"
import type { articleData } from '@/types/article'
import type { Comment } from "@/types/comments"
import { getArticle, likeArticle, dislikeArticle } from "@/api/articles"
import { useUserStore } from "./user"
import { getOrCreateGuestId } from "@/utils/guest"
import { useMessageStore } from "./message"
import { getAllComment } from "@/api/comments"

const messageStore = useMessageStore()
const userStore = useUserStore()

export const useFeedStore = defineStore('feed', () => {
    const articles = ref<articleData[]>([])
    const comments = ref<Comment[]>([])
    const page = ref(0)
    const isLoading = ref(false)
    const hasMore = ref(true)
    const commentPage = ref(0)
    const hasMoreComment = ref(true)
    const isLoadingComment = ref(false)

    // 加载初始文章
    const fetchInitialArticles = async () => {
        if (articles.value.length > 0) return //防止重复加载文章

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
                page.value += 0

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
        try {
            if (userStore.token) {
                // 用户
                if (article.isLiked) {
                    const id = messageStore.show('正在点赞', 'loading')
                    await likeArticle(articleId)
                    messageStore.update(id, { text: '点赞成功', type: 'success', duration: 2000 })
                } else {
                    const id = messageStore.show('正在取消点赞', 'loading')
                    await dislikeArticle(articleId)
                    messageStore.update(id, { text: '取消点赞成功', type: 'success', duration: 2000 })
                }
            } else {
                // 游客
                const guestId = getOrCreateGuestId()
                if (article.isLiked) {
                    const id = messageStore.show('正在点赞', 'loading')
                    await likeArticle(articleId, guestId)
                    messageStore.update(id, { text: '点赞成功', type: 'success', duration: 2000 })
                } else {
                    const id = messageStore.show('正在取消点赞', 'loading')
                    await dislikeArticle(articleId, guestId)
                    messageStore.update(id, { text: '取消点赞成功', type: 'success', duration: 2000 })
                }
            }
            return true
        } catch (error: any) {
            console.error(`为文章 ${articleId} 更新点赞状态失败：`, error);
            // 本地状态重置
            article.isLiked = originalIsLiked
            article.like_count = originalLikeCount
            if (error.response.status === 429) {
                messageStore.show('操作过于频繁', 'error', 2000)
            }
            return false
        }
    }

    // 获取文章评论
    const fetchInitialComments = async (articleId: string) => {
        if (comments.value.length > 0) return
        isLoadingComment.value = true
        try {
            const response = await getAllComment(articleId, { page: 1, pageSize: 3 })
            comments.value = response.data.data
            commentPage.value = 1
            hasMoreComment.value = comments.value.length < response.data.total
            return true
        } catch (error) {
            console.error('获取初始评论失败：', error);
            return false
        } finally {
            isLoadingComment.value = false
        }
    }
    // 加载更多文章评论
    const fetchMoreComments = async (articleId: string) => {
        if (isLoadingComment.value || !hasMoreComment.value) return
        isLoadingComment.value = true

        try {
            const nextPage = commentPage.value + 1
            const response = await getAllComment(articleId, { page: nextPage, pageSize: 3 })

            if (response.data.data.length > 0) {
                const existingIds = new Set(comments.value.map((c: Comment) => c.id))
                const newComments = response.data.data.filter((a: Comment) => !existingIds.has(a.id))
                comments.value.push(...newComments)
                commentPage.value += 1
                hasMoreComment.value = comments.value.length < response.data.total
                return true
            }
        } catch (error) {
            console.error('获取更多更多评论失败：', error);
            return false
        } finally {
            isLoadingComment.value = false
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
        comments,
        isLoadingComment,
        hasMoreComment,
        fetchInitialComments,
        fetchMoreComments
    }

})