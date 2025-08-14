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
// 更新密码（后面做）