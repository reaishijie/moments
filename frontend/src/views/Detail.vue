<script setup lang="ts" name="Detail">
import { onMounted, ref } from 'vue'
import { ChevronLeft } from '@vicons/fa';
import { Icon } from '@vicons/utils';
import ArticleItem from '@/components/article/ArticleItem.vue';
import router from '@/router';
import { useRoute } from 'vue-router';
import { type articleData } from '@/types/article';
import { useArticleStore } from '@/store/article';

const articleStore = useArticleStore()
const route = useRoute()
const articleId = Number(route.params.articleId)
const isLoading = ref(true)
const article = ref<articleData | null>(null);
const isShowInput = ref(false)
function toggleComment() {
    isShowInput.value = !isShowInput.value
}

onMounted(async() => {
    if (articleId) {
        try {
            // 直接等待 API 调用返回的文章对象
            await articleStore.fetchArticle(articleId);
            // 将文章赋值给本地的 ref 变量
            article.value = articleStore.article;
            await articleStore.fetchLikers(articleId);
            await articleStore.fetchComments(articleId);
        } catch (error) {
            console.error('Failed to load article details:', error);
        } finally {
            isLoading.value = false;
        }
    }
})
</script>
<template>
    <div class="container">
        <!-- 顶部栏 -->
        <div class="header">
            <div id="back" @click="router.back()">
                <Icon>
                    <ChevronLeft />
                </Icon>
            </div>
            <div>内容详情</div>
            <div class="func"></div>
        </div>
        <!-- 文章展示 -->
        <div class="body">
            <span v-if="!article">正在加载中...</span>
            <ArticleItem 
                v-if="article"
                :article="article"
                :likers="articleStore.likers || []"
                :comments="articleStore.comments || []"
                :is-show-input="!!isShowInput"
                :has-more-comments= false
                :remaining-comments= 0
                :is-loading-comments= false
                @like="() => articleStore.toggleLike(articleId)"
                @comment="() => toggleComment()"
                @send-reply="(payload) => articleStore.createComment(payload)"
                @load-more-comments="() => console.warn('点击了load-more-comments, 暂时不支持加载更多')"
            />
        </div>
    </div>
</template>
<style scoped>
.container {
    display: flex;
    flex-direction: column;
    min-width: 375px;
    width: 520px;
}

/* 头部栏 */
.header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    height: 6vh;
    color: #00000098;
    background: #f3f3f3e8;
    padding: 0px 5px 0px 10px;
}

#back {
    width: 36px;
    height: 36px;
    display: flex;
    justify-content: center;
    align-items: center;
}

#back:hover {
    color: #000000fb;
    background: #f0f0f08b;
    cursor: pointer;
    border-radius: 10px;
}

.func {
    width: 36px;
}

/* 主体 */
.body {
    display: flex;
    flex-direction: column;
    /* width: min(100%,520px); */
    width: 100%;
    background: #ffffff;
    min-height: 100vh;
}
.body span {
    margin-top: 40vh;
    display: flex;
    justify-content: center;
    align-items: center;
    color: skyblue;
}
</style>
