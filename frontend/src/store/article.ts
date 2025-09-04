import { defineStore } from "pinia";
import { reactive, ref } from "vue";
import { getArticleDetails, likeArticle, dislikeArticle, getArticleLikers as apiGetArticleLikers } from "@/api/articles";
import type { articleData } from "@/types/article";
import { createComment as apiCreateComment, getAllComment } from "@/api/comments";
import type { commentData, createCommentData } from "@/types/comments";
import { useMessageStore } from "./message"
import { useUserStore } from "./user";
import { getOrCreateGuestId } from "@/utils/guest";

const userStore = useUserStore()
const messageStore = useMessageStore()

export const useArticleStore = defineStore('article', () => {
    // 数据
    const article = ref<articleData | null>(null)
    const comments = ref<commentData[]>([])
    const likers = ref<any[]>([])
    const states = reactive({
        article: false,
        comment: false,
        liker: false
    })
    // 方法
    // 根据文章 id 获取单篇文章详情
    const fetchArticle = async (articleId: number) => {
        states.article = true
        try {
            const guestId = !userStore.token ? getOrCreateGuestId() : undefined
            const response = await getArticleDetails(articleId, guestId)
            article.value = response.data
        } catch (error) {
            console.error('获取文章内容失败：', error)
            article.value = null
        } finally {
            states.article = false
        }
    }
    // 获取点赞过的用户列表
    const fetchLikers = async (articleId: number) => {
        states.liker = true
        try {
            const res = await apiGetArticleLikers(articleId)
            likers.value = res.data
        } catch (error) {
            console.error(`获取文章 ${articleId} 的点赞用户列表失败`, error);
        } finally {
            states.liker = false
        }
    }
    // 获取评论
    const fetchComments = async (articleId: number) => {
        states.comment = true
        try {
            const response = await getAllComment(articleId, {page: 1, pageSize: 999})
            comments.value = response.data.data
            return true
        } catch (error) {
            console.error('获取评论失败', error);
            comments.value = []
            return false
        } finally {
            states.comment = false
        }
    }
    // 评论文章
    const createComment = async (payload: createCommentData) => {
        const id = messageStore.show('正在发表评论', 'loading')
        try {
            const res = await apiCreateComment(payload)
            if (res.data) {
                const newComment = res.data
                comments.value.push(newComment)
                if (article.value) {
                    article.value.comment_count++
                }
            }
            messageStore.update(id, {type: 'success', text: '发表成功', duration: 2000})
            return true
        } catch (error) {
            console.error('发表评论失败', error);
            messageStore.update(id, {type: 'error', text: '发表失败', duration: 2000})
            return false
        }
    }
    // 点赞、取消点赞
    const toggleLike = async (articleId: number) => {
        if (!article.value) return

        const originalIsLiked = article.value.isLiked
        const originalLikeCount = article.value.like_count

        // 本地乐观更新
        // 如果已经是 喜欢 -> 变为 不喜欢
        if (originalIsLiked) {
            article.value.isLiked = false
            article.value.like_count--
        } else {
            article.value.isLiked = true
            article.value.like_count++
        }

        const id = ref(1)
        // 更新数据库
        try {
            // 已登录用户
            if (userStore.token) {
                if (article.value.isLiked) {
                    id.value = messageStore.show('正在点赞', 'loading')
                    await likeArticle(articleId)
                    messageStore.update(id.value, { text: '点赞成功', type: 'success', duration: 2000 })
                } else {
                    id.value = messageStore.show('正在取消点赞', 'loading')
                    await dislikeArticle(articleId)
                    messageStore.update(id.value, { text: '取消点赞成功', type: 'success', duration: 2000 })
                }
            }
            // 游客
            else {
                const guestId = getOrCreateGuestId()
                if (article.value.isLiked) {
                    id.value = messageStore.show('正在点赞', 'loading')
                    await likeArticle(articleId, guestId)
                    messageStore.update(id.value, { text: '点赞成功', type: 'success', duration: 2000 })
                } else {
                    id.value = messageStore.show('正在取消点赞', 'loading')
                    await dislikeArticle(articleId, guestId)
                    messageStore.update(id.value, { text: '取消点赞成功', type: 'success', duration: 2000 })
                }
            }
            return true
        } catch (error: any) {
            console.error(`为文章${articleId}更新点赞状态失败`, error);
            // 本地状态重置
            article.value.isLiked = originalIsLiked
            article.value.like_count = originalLikeCount
            messageStore.update(id.value, { text: '操作失败', type: 'error', duration: 2000 })
            return false
        } finally {
            fetchLikers(articleId)
        }
    }

    return {
        article,
        comments,
        likers,
        states,
        fetchArticle,
        fetchLikers,
        fetchComments,
        createComment,
        toggleLike
    }
},
    // {

    //     persist: {
    //        storage: sessionStorage,
    // }
    //     }

)