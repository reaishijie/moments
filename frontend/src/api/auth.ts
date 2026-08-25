import service from '@/api/request'
import type { registerData, loginData, emailLoginData, resetPasswordData } from '@/types/user'

export type OAuthProvider = 'linux_do' | 'nodeloc' | 'rainbow' | 'google' | 'github'

export type OAuthProfile = {
    provider: OAuthProvider
    providerType?: string | null
    providerUserId: string
    nickname?: string | null
    avatar?: string | null
    email?: string | null
}

export type OAuthCallbackPayload = {
    authenticated?: boolean
    needBind?: boolean
    oauthTicket?: string
    profile?: OAuthProfile
}

export const getApiBaseUrl = () => (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
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

// 使用 HttpOnly Cookie 刷新令牌
export const refreshAccessToken = () => {
    return service({
        url: '/auth/refresh',
        method: 'post',
    })
}

// 当前登录用户绑定 OAuth 身份
export const bindOAuthAccount = (oauthTicket: string) => {
    return service({
        url: '/auth/oauth/bind',
        method: 'post',
        data: { oauthTicket },
    })
}

// 注册新账号并绑定 OAuth 身份
export const registerAndBindOAuth = (data: registerData & { oauthTicket: string }) => {
    return service({
        url: '/auth/oauth/register-bind',
        method: 'post',
        data,
    })
}

// 退出当前登录会话
export const logout = () => {
    return service({
        url: '/auth/logout',
        method: 'post',
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

// 验证当前启用的人机验证提供商
export const verifyCaptcha = (data: { captchaToken: string }) => {
    return service({
        url: '/notice/captcha',
        method: 'post',
        data
    })
}