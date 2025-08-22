<script setup lang="ts" name="Brief">
import { computed } from 'vue';
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const defaultNickname = '小辉'
const defaultAvatar = '/img/avatar.jpg'
const defaultBrief = '更简洁、更现代化的内容发布平台'
const nickname = computed(() => {
    return userStore.profile?.nickname || userStore.profile?.username || defaultNickname
})
const avatar = computed(() => {
    return userStore.profile?.avatar || defaultAvatar
})
const brief = computed(() => {
    return userStore.profile?.brief || defaultBrief
})
</script>

<template>
    <!-- 用户信息 -->
    <div class="brief">
        <div class="brief-img">
            <span>{{ nickname }}</span>
            <img :src="avatar" alt="avatar">
        </div>
        <p>{{ brief }}</p>
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
.brief-img {
    display: flex;
}
.brief-img span {
    padding: 5px;
    color: rgb(255, 255, 255, 0.9);
    margin-top: -35px;
    margin-right: 10px;
    z-index: 5;
    font-size: large;
    font-weight: 600;
}
/* 简介头像 */
.brief-img img {
    border-radius: 10%;
    width: 60px;
    height: 60px;
    margin-top: -35px;
    margin-right: 25px;
    z-index: 5;
}
.brief-img img:hover {
    cursor: pointer;
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