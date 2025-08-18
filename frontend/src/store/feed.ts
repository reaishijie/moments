/** 创建文章加载流 */
import { defineStore } from "pinia"
import { ref } from "vue"
import type { articleData } from '@/types/article'
import { getArticle } from "@/api/articles"

export const useFeedStore = defineStore('feed', () => {
    const articles = ref<articleData[]>([])
    const page = ref(0)
    const isLoading = ref(false)
    const hasMore = ref(true)

    // 加载初始文章
    const fetchInitialArticles = async () => {
        if (articles.value.length > 0) return //防止重复加载文章

        isLoading.value = true
        try {
            const response = await getArticle({ page: 1, pageSize: 5 })
            articles.value = response.data.data
            page.value = 1
            hasMore.value = articles.value.length < response.data.total
            return true
        } catch (error) {
            console.error('获取初始文章失败：', error)
            return false
        } finally {
            isLoading.value = false
        }
    }
    // 加载更多文章
    const fetchMoreArticles = async () => {
        // 如果正在加载或文章没有更多，直接返回
        if (isLoading.value || !hasMore.value) return {status: 0}

        isLoading.value = true
        try {
            const nextPage = page.value + 1
            const response = await getArticle({ page: nextPage, pageSize: 5 })

            // 将新文章数据放入articles数组中
            if (response.data.data.length > 0) {
                // articles.value.push(...response.data.data)
                const existingIds = new Set(articles.value.map((a: articleData) => a.id));
                // 使用existingIds.has(a.id)判断每一个a.id是否包含在articles数组内，filter将为真的结果返回
                const newArticles = response.data.data.filter((a: articleData) => !existingIds.has(a.id));

                articles.value.push(...newArticles);
                page.value += 1
            }
            hasMore.value = articles.value.length < response.data.total
            return { status: 1}
        } catch (error) {
            console.error('获取更多文章失败:', error)
            return { status: 2, error}
        } finally {
            isLoading.value = false
        }
    }

    // 将数据和方法返回
    return {
        articles,
        isLoading,
        hasMore,
        fetchInitialArticles,
        fetchMoreArticles
    }

})