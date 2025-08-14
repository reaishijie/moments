<script setup lang="ts" name="ArticleList">
import ArticleItem from './ArticleItem.vue';
import { onMounted, onUnmounted, ref } from 'vue';
import { useFeedStore } from '@/store/feed';
const feedStore = useFeedStore()
// 创建一个 ref 来引用滚动触发器元素
const scrollTrigger = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
// 组件挂载的时候执行
onMounted(async() => {
    await feedStore.fetchInitialArticles()

    // 创建 Intersection Observer 实例
    observer = new IntersectionObserver(
        (entries) => {
            // 当触发器元素进入视口时，entries[0].isIntersecting 会是 true
            if (entries[0].isIntersecting) {
                console.log('滚动到底部，加载更多...');
                feedStore.fetchMoreArticles();
            }
        },
        {
            // 当触发器元素距离视口底部 100px 时，就触发回调
            rootMargin: '0px 0px 100px 0px',
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
</script>

<template>
    <!-- 展示内容 -->
    <div class="article-container">
        <ul>
            <li v-for="article in feedStore.articles" :key="article.id">
                <ArticleItem :article="article" />
                <div class="divider"></div>
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
    height: 50px;
}

.status-indicator {
    text-align: center;
    color: #888;
    padding: 1.5rem;
}
</style>