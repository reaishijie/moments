import { defineStore } from "pinia";
import adminRoutes from "@/router/admin";
import { ref } from "vue";


export const useSidebarStore = defineStore('sidebar', () => {
    // 路由中的各项
    const arr = adminRoutes[0].children
    // 是否展示菜单内容
    const isShowContent = ref(true)
    return {
        arr,
        isShowContent
    }
})