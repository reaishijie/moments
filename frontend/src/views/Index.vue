<!-- 首页展示页面 -->
<script setup lang="ts" name="Index">
import Header from '@/components/Header.vue';
import Brief from '@/components/Brief.vue';
import ArticleList from '@/components/article/ArticleList.vue';
</script>

<template>
    <div class="main">
        <Header> </Header>
        <Brief> </Brief>
        <ArticleList> </ArticleList>
    </div>
</template>

<style scoped>
/* 主容器 */
.main {
    display: flex;
    flex-direction: column;
    width: 100%;
    background-color: #ffffff;
}
</style>