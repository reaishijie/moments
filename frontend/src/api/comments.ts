import service from '@/api/request'
import type { createCommentData } from '@/types/comments'

// 创建评论
export const createComment = (data: createCommentData) => {
    return service({
        url: '/comments',
        method: 'post',
        data
    })
}
// 更新评论（暂无计划）
// 删除评论
export const deleteComment = (commnetId: string | number) => {
    return service({
        url: `/comments/${commnetId}`,
        method: 'delete',
    })
}

// 获取一篇文章的评论
export const getCommentsByArticleId = (articleId: number, params?: {page?: number, pageSize?: number}) => {
    return service({
        url: `/articles/${articleId}/comments`,
        method: 'get',
        params,
    })
}

// 获取所有评论
export const getAllComment = (articleId: number, params?: {page?: number, pageSize?: number} ) => {
    return service({
        url: `comments/${articleId}`,
        method: 'get',
        params,
    })
}