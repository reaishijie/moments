import { defineStore } from "pinia";
import adminRoutes from "@/router/admin";
import { ref } from "vue";


export const useSidebarStore = defineStore('sidebar', () => {
    const arr = adminRoutes[0].children
    const isShowContent = ref(true)
    return {
        arr,
        isShowContent
    }
})