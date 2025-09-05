<script setup lang="ts" name="ArticleList">
import ArticleItem from './ArticleItem.vue';
import { onMounted, onUnmounted, ref } from 'vue';
import { useFeedStore } from '@/store/feed';
import { useMessageStore } from '@/store/message'

const messageStore = useMessageStore()
const feedStore = useFeedStore()

// 创建一个 ref 来引用滚动触发器元素
const scrollTrigger = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
const isShowInputMap = ref<Record<number, boolean>>({})

const fetchNewArticleData = async (articlesToFetch: any[]) => {
    for (const article of articlesToFetch) {
        if (!feedStore.articleLikesMap[article.id]) {
            await feedStore.fetchArticleLikers(article.id);
        }
        if (!feedStore.commentsMap[article.id]) {
            await feedStore.fetchInitialComments(article.id);
        }
    }
}
// 组件挂载的时候执行
onMounted(async () => {
    const id = messageStore.show('正在加载文章', 'loading')
    const isSuccess = await feedStore.fetchInitialArticles()
    if (isSuccess) {
        await fetchNewArticleData(feedStore.articles);
        setTimeout(() => {
            messageStore.update(id, { type: 'success', text: '文章加载成功', duration: 2000 })
        }, 1000);
    } else {
        messageStore.update(id, { type: 'error', text: '文章加载失败', duration: 2000 })
    }
    // 创建 Intersection Observer 实例
    observer = new IntersectionObserver(
        async (entries) => {
            // 当触发器元素进入视口时，entries[0].isIntersecting 会是 true
            if (entries[0].isIntersecting) {
                console.log('滚动到底部，加载更多...');
                const id = messageStore.show('正在加载文章', 'loading')

                const articlesBeforeFetch = feedStore.articles.length
                const res = await feedStore.fetchMoreArticles()
                // 消息通知
                if (res?.status === 0) {
                    messageStore.update(id, { type: 'info', text: '没有更多文章了', duration: 2000 })
                } else if (res?.status === 1) {
                    const newArticles = feedStore.articles.slice(articlesBeforeFetch)
                    await fetchNewArticleData(newArticles)
                    messageStore.update(id, { type: 'success', text: '文章加载成功', duration: 2000 })
                } else {
                    messageStore.update(id, { type: 'error', text: '文章加载失败', duration: 2000 })
                }
            }
        },
        {
            rootMargin: '0px 0px 10px 0px',
        }
    );
    // 开始监听触发器元素
    if (scrollTrigger.value) {
        observer.observe(scrollTrigger.value);
    }
})
onUnmounted(() => {
    if (observer && scrollTrigger.value) {
        observer.unobserve(scrollTrigger.value);
    }
})

// ArticleItem事件处理
function handleLike(articleId: number) {
    feedStore.toggleLike(articleId)
}
function toggleComment(articleId: number) {
    isShowInputMap.value[articleId] = !isShowInputMap.value[articleId]
}
// 处理回复评论
async function handleSendReply(payload: { articleId: number, content: string, parentId?: string }) {
    const success = await feedStore.createComment(payload)
    if (success) {
        messageStore.show('评论成功', 'success', 2000)
    } else {
        messageStore.show('评论失败', 'error', 2000)
    }
}
function handleLoadMoreComments(articleId: number) {
    feedStore.fetchMoreComments(articleId)
}
</script>

<template>
    <!-- 展示内容 -->
    <div class="article-container">
        <ul>
            <li v-for="article in feedStore.articles" :key="article.id">
                <ArticleItem :article="article" :likers="feedStore.articleLikesMap[article.id] || []"
                    :comments="feedStore.commentsMap[article.id] || []" :is-show-input="!!isShowInputMap[article.id]"
                    :has-more-comments="feedStore.commentPagination[article.id]?.hasMore ?? false"
                    :remaining-comments="feedStore.commentPagination[article.id]?.remaining ?? 0"
                    :is-loading-comments="feedStore.commentPagination[article.id]?.isLoading ?? false"
                    @like="handleLike" @comment="() => toggleComment(article.id)" @send-reply="handleSendReply"
                    @load-more-comments="() => handleLoadMoreComments(article.id)" />
            </li>
        </ul>
        <div ref="scrollTrigger" class="scroll-trigger"></div>

        <div v-if="feedStore.isLoading" class="status-indicator">
            正在加载中...
        </div>
        <div v-if="!feedStore.hasMore && feedStore.articles.length > 0" class="status-indicator">
            - 没有更多了 -
        </div>
    </div>
</template>

<style scoped>
.article-container {
    width: 100%;
}

.article-container ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.scroll-trigger {
    height: 1px;
    margin-bottom: -20px;
}

.status-indicator {
    font-size: smaller;
    text-align: center;
    color: #888;
    padding: 1.5rem;
}
</style>