import { ref } from "vue"
import { defineStore } from "pinia"
import type { emailLoginData, userData} from '@/types/user'
import { login, loginByEmailCode, logout } from "@/api/auth"
import { getUserInfo } from "@/api/users"

type TokenResponse = {
    accessToken: string
    refreshToken: string
    expiresIn?: number
}

export const useUserStore = defineStore('user', () => {
    // accessToken / refreshToken 由 Pinia 持久化到 localStorage.user
    const accessToken = ref<string | null>(null)
    const refreshToken = ref<string | null>(null)
    const profile = ref<userData | null>(null)

    const setTokenPair = (tokens: TokenResponse) => {
        accessToken.value = tokens.accessToken
        refreshToken.value = tokens.refreshToken
        // 避免和 Pinia persist 的 localStorage.user 重复存储，清理旧版本独立 key
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('token')
    }

    // 登录
    const handleLogin = async(credentials: any) => {
        try {
            const response = await login(credentials)
            setTokenPair(response.data)
            // 登录成功后立即获取用户信息
            await fetchUserProfile()
            return { status: 0, response }
        } catch (error:any) {
            return { status: 1, error}
        }
    }
    const handleEmailLogin = async(credentials: emailLoginData) => {
        try {
            const response = await loginByEmailCode(credentials)
            setTokenPair(response.data)
            await fetchUserProfile()
            return { status: 0, response }
        } catch (error:any) {
            return { status: 1, error}
        }
    }
    const fetchUserProfile = async() => {
        if(!accessToken.value) return
        try {
            const response = await getUserInfo()
            profile.value = response.data
        } catch (error) {
            console.log('获取用户信息失败：', error)
            handleLogout(false)
        }
    }
    // 退出登录
    const handleLogout = async(syncServer = true) => {
        if (syncServer && accessToken.value) {
            try {
                await logout()
            } catch (error) {
                console.log('退出登录同步失败：', error)
            }
        }
        accessToken.value = null
        refreshToken.value = null
        profile.value = null
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
    }
    return {
        accessToken,
        refreshToken,
        profile,
        setTokenPair,
        handleLogin,
        handleEmailLogin,
        handleLogout,
        fetchUserProfile
    }
},
{
    persist: true
}
)
