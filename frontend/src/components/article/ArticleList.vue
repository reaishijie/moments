<script setup lang="ts" name="ArticleList">
import ArticleItem from './ArticleItem.vue';
import { useArticleStore } from '@/store/article';
const articleStore = useArticleStore()

</script>

<template>
    <!-- 展示内容 -->
    <div class="article-container">
        <ul>
            <li v-for="article in articleStore.articles" :key="article.id">
                <ArticleItem :article="article" />
                <div class="divider"></div>
            </li>
        </ul>
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
</style>