<script setup lang="ts" name="Detail">
import { reactive, onMounted } from 'vue'
import { ChevronLeft } from '@vicons/fa';
import { Icon } from '@vicons/utils';
import ArticleItem from '@/components/article/ArticleItem.vue';
import router from '@/router';
import { useRoute } from 'vue-router';
import { getArticleDetails } from '@/api/articles';
import { type articleData } from '@/types/article';

const article = reactive<articleData>({
    id: 0,
    user_id: 0,
    nickname: '',
    avatar: '',
    content: 'Loading...',
    type: 0, is_top: false,
    is_ad: false, isLiked: false,
    like_count: 0,
    comment_count: 0,
    location: '',
    created_at: '',
    user: {
        id: '',
        username: '',
        nickname: '',
        avatar: '',
    },
    article_images: [],
    article_videos: []
})

const route = useRoute()
const articleId = Number(route.params.articleId)

const fetchArticle = async (articleId: number) => {
    try {
        const res = await getArticleDetails(articleId)
        if (res.data) { 
            Object.assign(article, res.data)
            console.log(res, '\n', article);
        }
    } catch (error) {
        console.error("Failed to fetch article details:", error);
    }
}
onMounted(() => {
    if (articleId) {
        console.log('@articleId存在');
        fetchArticle(articleId)
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
            <ArticleItem v-if="article.id !== 0" :article="article" />
            <span v-if="article.id === 0">正在加载中...</span>
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
