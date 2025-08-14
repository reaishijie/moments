import service from '@/api/request'
import type { registerData, loginData } from '@/types/user'
// 注册
export const register = (data: registerData) => {
    return service({
        url: '/auth/register',
        method: 'post',
        data,
    })
}
// 登录
export const login = (data: loginData) => {
    return service({
        url: '/auth/login',
        method: 'post',
        data,
    })
}