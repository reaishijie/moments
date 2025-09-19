import service from '@/api/request'

// 获取用户数
export const getUserCount = () => {
    return service({
        url: '/admin/user',
        method: 'get',
    })
}
// 获取文章数
export const getArticleCount = () => {
    return service({
        url: '/admin/article',
        method: 'get',
    })
}
// 获取评论数
export const getCommentCount = () => {
    return service({
        url: '/admin/comment',
        method: 'get',
    })
}