import { defineStore } from "pinia";
import { ref } from "vue";
import { getArticleDetails } from "@/api/articles";
import type { articleData } from "@/types/article";
import { createComment, getCommentsByArticleId } from "@/api/comments";
import type { commentData, createCommentData } from "@/types/comments";


export const useArticleStore = defineStore('article', () => {
    const article = ref<articleData | null>(null)
    const comments = ref<commentData[]>([])
    const isLoading = ref(false)

    // 根据文章 id 获取单篇文章详情
    const fetchArticle = async(articleId: string| number) => {
        isLoading.value = true
        try {
            const response = await getArticleDetails(articleId)
            article.value = response.data
        } catch (error) {
            console.error('获取文章内容失败：', error)
            article.value = null
        } finally {
            isLoading.value = false
        }
    }

    // 获取文章的评论列表
    const fetchComments = async(articleId: string| number) => {
        try {
            const response = await getCommentsByArticleId(articleId)
            comments.value = response.data.data
        } catch (error) {
            console.error('获取评论失败：', error)
            comments.value = []
        }
    }

    // 发表新评论
    const postComment = async (commentData: createCommentData) => {
        try {
            await createComment(commentData)
            // 评论成功后立即获取评论列表，显示最新评论
            await fetchComments(commentData.articleId)
            return true
        } catch (error) {
            console.error('发表评论失败：', error)
            return false
        }
    }

    return {
        article,
        comments,
        isLoading,
        fetchArticle,
        fetchComments,
        postComment
    }
},
{
    
    persist: {
       storage: sessionStorage,
}
    }
    
)