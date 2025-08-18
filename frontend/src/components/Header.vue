<script setup lang="ts" name="Header">
import {  computed } from 'vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

// 默认背景图
const defaultBackground = '/img/background.mp4'

// 获取背景路径（优先使用用户配置）
const backgroundPath = computed(() => {
  return userStore.profile?.header_background || defaultBackground
})

console.log(backgroundPath.value);

// 判断文件类型
const isImage = computed(() => {
  const imageExtension = ['jpg', 'png', 'webp', 'svg', 'gif']
  const ext = backgroundPath.value.split('.').pop()?.toLowerCase()
  return ext ? imageExtension.includes(ext) : false
})

const isVideo = computed(() => {
  const videoExtension = ['mp4', 'webm', 'ogg', 'mov']
  const ext = backgroundPath.value.split('.').pop()?.toLowerCase()
  return ext ? videoExtension.includes(ext) : false
})
</script>

<template>
  <div class="header">
    <img v-if="isImage" :src="backgroundPath" alt="顶部图片" />
    <video v-else-if="isVideo" :src="backgroundPath" autoplay muted loop playsinline />
    <video v-else :src="defaultBackground" autoplay muted loop playsinline />
  </div>
</template>

<style scoped>
/* 顶部容器 */
.header {
    width: 100%;
    height: 40vh;
    overflow: hidden;
}

/* 顶部图片 */
.header img,
video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
}
</style>