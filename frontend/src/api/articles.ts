import service from '@/api/request'
import type { createArticleData, updateArticleData } from '@/types/article'
import { getOrCreateGuestId } from '@/utils/guest'
import { useUserStore } from '@/store/user'

// 创建文章
export const createArticle = (data: createArticleData) => {
    return service({
        url: '/articles',
        method: 'post',
        data
    })
}
// 获取文章列表
export const getArticle = (params?: { page?: number, pageSize?: number, userId?: number}, guestId?: string) => {
    return service({
        url: '/articles',
        method: 'get',
        params,
        headers: guestId ? { 'X-Guest-ID': guestId } : {},
    })
}
// 根据文章id获取单篇文章详情
export const getArticleDetails = (articleId : string | number, guestId: string | undefined) => {
    return service({
        url: `/articles/${articleId}`,
        method: 'get',
        headers: guestId ? { 'X-Gueat-ID': guestId} : {},
    })
}
// 更新文章
export const updateArticle = (articleId: string | number, data: updateArticleData ) => {
    return service({
        url: `/articles/${articleId}`,
        method: 'patch',
        data
    })
}
// 删除文章
export const deleteArticle = (articleId: string | number) => {
    return service({
        url: `/articles/${articleId}`,
        method: 'delete',
    });
}
// 文章点赞
export const likeArticle = (articleId: string | number, guestId?: string) => {
    const userStore = useUserStore()
    if(!userStore.token) {
        guestId = getOrCreateGuestId()
    }
    return service({
        url: `/articles/${articleId}/like`,
        method: 'post',
        // 如果是访客，则添加自定义请求头
        headers: guestId? {'X-Guest-ID': guestId } : {}
    })
}
// 取消文章点赞
export const dislikeArticle = (articleId: string | number , guestId?: string) => {
    const userStore = useUserStore()
    if(!userStore.token) {
        guestId = getOrCreateGuestId()
    }
    return service({
        url: `/articles/${articleId}/like`,
        method: 'delete',
        headers: guestId? {'X-Guest-ID': guestId } : {}
    })
}
// 获取文章点赞用户信息
export const getArticleLikers = (articleId: string | number) => {
    return service({
        url: `/articles/${articleId}/like`,
        method: 'get'
    })
}