<script setup lang="ts" name="Header">
import { useUserStore } from '@/store/user'
const {user} = useUserStore() /* 将user从useUserStore中解构出来 */

// 文件后缀判断
const imageExtension = ['jpg', 'png', 'webp', 'svg', 'gif']
const videoExtension = ['mp4', 'webm', 'ogg', 'mov']
const  iE = user.headerBackground.split('.')[1].toLowerCase()
const  vE = user.headerBackground.split('.')[1].toLowerCase()
const isImage = imageExtension.includes(iE)
const isVideo = videoExtension.includes(vE)
</script>

<template>
    <!-- 顶部图片/视频 -->
    <div class="header">
        <img :src='user.headerBackground' v-if="isImage" alt="顶部图片">
        <video :src="user.headerBackground" v-if="isVideo" autoplay muted loop playsinline></video>
    </div>
</template>

<style scoped>
/* 顶部容器 */
.header{
    width: 100%;
    height: 40vh;
    overflow: hidden;
}
/* 顶部图片 */
.header img, video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
}
</style>