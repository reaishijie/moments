/** 创建文章加载流 */
import { defineStore } from "pinia"
import { ref } from "vue"
import type { articleData } from '@/types/article'
import { getArticle } from "@/api/articles"

export const useFeedStore = defineStore('feed', () => {
    const articles = ref<articleData[]>([])
    const page = ref(1)
    const isLoading = ref(false)
    const hasMore = ref(true)

    // 加载初始文章
    const fetchInitialArticles = async() => {
        if(articles.value.length > 0) return //放置重复加载文章

        isLoading.value = true
        try {
            const response = await getArticle({page: 1, pageSize: 5})
            articles.value = response.data.data
            page.value = 1
            hasMore.value = articles.value.length < response.data.total
        } catch (error) {
            console.error('获取初始文章失败：', error)
        } finally {
            isLoading.value = false
        }
    }
    // 加载更多文章
    const fetchMoreArticles = async () => {
        // 如果正在加载或文章没有更多，直接返回
        if(isLoading.value || !hasMore.value) return
        
        isLoading.value = true
        try {
            const nextPage = page.value + 1
            const response = await getArticle({page: nextPage, pageSize: 3})

            // 将新文章数据放入articles数组中
            if(response.data.data.length > 0) {
                articles.value.push(...response.data.data)
                page.value += 1
            }
            hasMore.value = articles.value.length < response.data.total
        } catch (error) {
            console.error('获取更多文章失败:', error)
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