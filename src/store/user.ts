import { ref } from "vue"
import { defineStore } from "pinia"
import type { userData} from '@/types/user'
import { login } from "@/api/auth"
import { getUserInfo } from "@/api/users"

export const useUserStore = defineStore('user', () => {
    const token = ref(localStorage.getItem('token') || null)
    const profile = ref<userData | null>(null)

    const handleLogin = async(credentials: any) => {
        try {
            const response = await login(credentials)
            token.value = response.data.token
            localStorage.setItem('token', response.data.token)
            // 登录成功后立即获取用户信息
            await fetchUserProfile()
            return true
        } catch (error) {
            console.log('登录失败：', error);
            return false
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