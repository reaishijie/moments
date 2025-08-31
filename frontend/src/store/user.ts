import { ref } from "vue"
import { defineStore } from "pinia"
import type { userData} from '@/types/user'
import { login } from "@/api/auth"
import { getUserInfo } from "@/api/users"

export const useUserStore = defineStore('user', () => {
    const token = ref(localStorage.getItem('token') || null)
    const profile = ref<userData | null>(null)
    // 登录
    const handleLogin = async(credentials: any) => {
        try {
            const response = await login(credentials)
            token.value = response.data.token
            localStorage.setItem('token', response.data.token)
            // 登录成功后立即获取用户信息
            await fetchUserProfile()
            return { status: 0, response }
        } catch (error:any) {
            return { status: 1, error}
        }
    }
    const fetchUserProfile = async() => {
        if(!token.value) return
        try {
            const response = await getUserInfo()
            profile.value = response.data
        } catch (error) {
            console.log('获取用户信息失败：', error)
            handleLogout()
        }
    }
    // 退出登录
    const handleLogout = () => {
        token.value = null
        profile.value = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
    }
    return {
        token,
        profile,
        handleLogin,
        handleLogout,
        fetchUserProfile
    }
},
{
    persist: true
}
)