import service from '@/api/request'
import { type updateConfigData } from '@/types/admin'

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

// 获取公共设置
export const getPublicConfig = () => {
    return service({
        url: '/admin/publicConfig',
        method: 'get',
    })
}
// 获取全部设置（需admin）
export const getConfig = () => {
    return service({
        url: '/admin/config',
        method: 'get',
    })
}

// 修改全部设置（需admin）
export const updateConfig = (data: updateConfigData) => {
    return service({
        url: '/admin/config',
        method: 'patch',
        data,
    })
}