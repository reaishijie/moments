import service from '@/api/request'
import type { registerData, loginData, emailLoginData, resetPasswordData } from '@/types/user'
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

// 邮箱验证码登录
export const loginByEmailCode = (data: emailLoginData) => {
    return service({
        url: '/auth/login-email',
        method: 'post',
        data,
    })
}

// 邮箱验证码重置密码
export const resetPassword = (data: resetPasswordData) => {
    return service({
        url: '/auth/reset-password',
        method: 'post',
        data,
    })
}

// 发送邮箱验证码
export const sendEmailCode = (email: string) => {
    return service({
        url: '/notice/sendEmail',
        method: 'post',
        data: { email },
    })
}

// 验证hcaptcha
export const verifyHcaptcha = (data: {captchaToken: string}) => {
    return service({
        url: 'notice/hcaptcha',
        method: 'post',
        data
    })
}