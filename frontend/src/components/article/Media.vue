<script setup lang="ts" name="Media">
import { ref, onMounted, onUnmounted } from 'vue'
import { type articleData } from '@/types/article';
import { useMessageStore } from '@/store/message';

const messageStore = useMessageStore()
defineProps({
    article: {
        type: Object as () => articleData,
        required: true
    }
})
const enlargedImage = ref<string | null>(null)

const showImage = (url: string) => {
    enlargedImage.value = url
}

const closeImage = () => {
    enlargedImage.value = null
}

const videoRef = ref<HTMLVideoElement | null>(null)
const handlePlay = () => messageStore.show('播放视频', 'info', 2000)
const handlePause = () => messageStore.show('暂停视频', 'info', 2000)

onMounted(() => {
    if (videoRef.value) {
        videoRef.value.addEventListener('play', handlePlay)
        videoRef.value.addEventListener('pause', handlePause)
    }
})
onUnmounted(() => {
    if (videoRef.value) {
        videoRef.value.removeEventListener('play', handlePlay)
        videoRef.value.removeEventListener('pause', handlePause)
    }
})
</script>

<template>
    <div class="container">
        <ul v-if="article.article_images.length !== 0">
            <li v-for="image in article.article_images" :key="image.id" @click="showImage(image.image_url)">
                <img :src="image.image_url" alt="文章图片">
            </li>
        </ul>
        <video v-if="article.article_videos.length !== 0 && article.article_images.length === 0"
            :src="article.article_videos[0]?.video_url" ref="videoRef" muted playsinline controls />
        <div v-if="enlargedImage" class="overlay" @click="closeImage">
            <img :src="enlargedImage" class="enlarged" alt="放大图片">
        </div>
    </div>
</template>

<style scoped>
.container {
    width: 100%;
    display: flex;
    flex-direction: row;
}

ul {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    list-style: none;
    outline: none;
    padding: 0;
    margin: 0;
    gap: 8px;
}

li {
    list-style: none;
    outline: none;
    padding: 0;
    margin: 0;
    /* flex: 1; */
    width: 28%;
    aspect-ratio: 1/1;
    cursor: pointer;
}

img {
    margin: 5px 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

video {
    display: flex;
    margin: 5px 0;
    width: 60%;
    height: auto;
    object-fit: contain;
}

/* 图片放大 */
.overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.685);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.enlarged {
    max-width: 90%;
    max-height: 90%;
    object-fit: contain;
    /* 保持原图比例 */
}
</style>