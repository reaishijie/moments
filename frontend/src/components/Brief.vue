<script setup lang="ts" name="Brief">
import { useUserStore } from '@/store/user'
const userStore = useUserStore()
</script>

<template>
    <!-- 用户信息 -->
    <div class="brief">
        <img :src="userStore.user.avatar" alt="avatar">
        <p>{{ userStore.user.brief }}</p>
    </div>
</template>

<style scoped>
/* 简介 */
.brief {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    /* background-color: wheat; */
}

/* 简介头像 */
.brief img {
    border-radius: 10%;
    width: 60px;
    height: 60px;
    margin-top: -35px;
    margin-right: 25px;

}

/* 简介语 */
.brief p {
    margin: 5px 5px 1px 5px;
    padding: 5px;
    font-size: smaller;
    color: #787878;
    font-style: italic;
    
}
</style>