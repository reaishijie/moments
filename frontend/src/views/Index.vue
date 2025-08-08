<!-- 首页展示页面 -->
<script setup lang="ts" name="">
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
    min-width: 300px;
    max-width: 550px;
    display: flex;
    flex-direction: column;
    background-color: #ffffff;
    border-radius: 5px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
</style>