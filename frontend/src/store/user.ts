import { ref } from "vue"
import { defineStore } from "pinia"
import type { emailLoginData, userData } from '@/types/user'
import { login, loginByEmailCode, logout, refreshAccessToken } from "@/api/auth"
import { getUserInfo } from "@/api/users"

type AccessTokenResponse = {
    accessToken: string
    expiresIn?: number
}

function removeLegacyTokenStorage() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
}

export const useUserStore = defineStore('user', () => {
    const accessToken = ref<string | null>(null)
    const profile = ref<userData | null>(null)
    let refreshingSession: Promise<string | null> | null = null

    removeLegacyTokenStorage()

    const setAccessToken = (tokens: AccessTokenResponse) => {
        accessToken.value = tokens.accessToken
    }

    const clearAuthState = () => {
        accessToken.value = null
        profile.value = null
        removeLegacyTokenStorage()
    }

    const fetchUserProfile = async () => {
        if (!accessToken.value) return
        try {
            const response = await getUserInfo()
            profile.value = response.data
        } catch (error) {
            console.log('获取用户信息失败：', error)
            clearAuthState()
        }
    }

    const refreshSession = async (force = false) => {
        if (accessToken.value && !force) return accessToken.value

        if (!refreshingSession) {
            refreshingSession = (async () => {
                try {
                    const response = await refreshAccessToken()
                    setAccessToken(response.data)
                    return response.data.accessToken
                } catch {
                    clearAuthState()
                    return null
                } finally {
                    refreshingSession = null
                }
            })()
        }

        return refreshingSession
    }

    const restoreSession = async (force = false) => {
        const token = await refreshSession(force)
        if (token) await fetchUserProfile()
    }

    // 登录
    const handleLogin = async (credentials: any) => {
        try {
            const response = await login(credentials)
            setAccessToken(response.data)
            await fetchUserProfile()
            return { status: 0, response }
        } catch (error: any) {
            return { status: 1, error }
        }
    }

    const handleEmailLogin = async (credentials: emailLoginData) => {
        try {
            const response = await loginByEmailCode(credentials)
            setAccessToken(response.data)
            await fetchUserProfile()
            return { status: 0, response }
        } catch (error: any) {
            return { status: 1, error }
        }
    }

    // 退出登录
    const handleLogout = async (syncServer = true) => {
        if (syncServer && accessToken.value) {
            try {
                await logout()
            } catch (error) {
                console.log('退出登录同步失败：', error)
            }
        }
        clearAuthState()
    }

    return {
        accessToken,
        profile,
        setAccessToken,
        clearAuthState,
        refreshSession,
        restoreSession,
        handleLogin,
        handleEmailLogin,
        handleLogout,
        fetchUserProfile,
    }
})
