import { defineStore } from "pinia";
import { ref } from "vue";

export const useAuthStore = defineStore('auth', () => {
    const isShow = ref(false)
    const showAuth = () => isShow.value = true
    const closeAuth = () => isShow.value = false
    
    return {
        isShow,
        showAuth,
        closeAuth
    }
})