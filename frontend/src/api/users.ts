import service from '@/api/request'
import type { updateUserInfoData } from '@/types/user'

// 获取用户信息
export const getUserInfo = () => {
    return service({
        url: '/user',
        method: 'get'
    })
}
// 更新用户信息
export const updateUserInfo = (data: updateUserInfoData) => {
    return service({
        url: '/user',
        method: 'patch',
        data
    })
}
// 根据 用户名 查询一些用户信息，主要是id
export const getUserIdByUsername = (username:any) => {
    return service({
        url: `/user/${username}`,
        method: 'get'
    })
}

// 更新密码（后面做）