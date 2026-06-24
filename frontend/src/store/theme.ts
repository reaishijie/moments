import { defineStore } from "pinia"
import { ref, watch, computed } from "vue"
import type { PersistenceOptions } from 'pinia-plugin-persistedstate'

// 辅助函数：获取系统偏好主题 (仅在没有本地存储时使用)
const getSystemPreferenceTheme = () => {
    // 检查用户系统偏好 (prefers-color-scheme)
    if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light'; // 默认 fallback
};

export const useThemeStore = defineStore('theme', () => {
    const currentTheme = ref(getSystemPreferenceTheme())
    // 切换主题
    const toggleTheme = () => {
        currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light';
    }
    watch(currentTheme, (newTheme) => {
        // 确保 DOM 操作只在客户端执行
        if (typeof document !== 'undefined') {
            document.body.classList.remove('light-mode', 'dark-mode');

            if (newTheme === 'dark') {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.add('light-mode');
            }
        }
    }, { immediate: true }); // immediate: true 确保在应用加载时立即设置正确的 class
    const defaultOutsideBgColor = computed(() => {
    return currentTheme.value === 'dark' ? '#0a0a0a' : '#f0f0f0';
    // 这些值应该与您的 main.css 中的 --color-bg-outside 变量对应！
  });
    return {
        currentTheme,
        toggleTheme,
        defaultOutsideBgColor
    }
}, {
    persist: {
        key: 'user-theme',
        storage: localStorage,
        paths: ['currentTheme']
    } as PersistenceOptions<any>
})