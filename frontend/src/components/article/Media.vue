<script setup lang="ts" name="Media">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import type { articleImageItem, articleVideoItem } from '@/types/article';
import { useMessageStore } from '@/store/message';
import { Icon } from '@vicons/utils';
import { Plus, TrashAltRegular } from '@vicons/fa';

const messageStore = useMessageStore()
// 改为通用组件，只要传递过来 图片数组 / 视频数组
const props = defineProps({
    articleImages: {
        type: Array as () => articleImageItem[],
        required: true
    },
    articleVideos: {
        type: Array as () => articleVideoItem[],
        required: true
    },
    upload: {
        type: Boolean,
        default: false
    },
    uploadNumber: {
        type: String,
        required: false
    }
})
const apiUrl = import.meta.env.VITE_API_BASE_URL as string
const baseUrl = new URL(apiUrl).origin
/**
 * const baseUrl = apiUrl.replace(/\/api.*$/, '') // 移除 /api 及其后面的内容
 * const baseUrl = apiUrl.match(/^https?:\/\/[^\/]+/)?.[0] || apiUrl
 */
// 创建计算属性,而不是直接修改props
const processedImages = computed(() => {
    if (!props.articleImages?.length) return []
    
    return props.articleImages.map((i) => {
        if (i?.image_url?.startsWith('/') && apiUrl?.startsWith('http')) {
            return { ...i, image_url: baseUrl + i.image_url }
        }
        return i
    }).filter(Boolean) // 过滤掉 undefined/null
})
const processedVideos = computed(() => {
    if (!props.articleVideos?.length) return []

    return props.articleVideos.map((i) => {
        if (i?.video_url?.startsWith('/') && apiUrl?.startsWith('http')) {
            return { ...i, video_url: baseUrl + i.video_url }
        }
        if (i?.thumbnail_url?.startsWith('/') && apiUrl?.startsWith('http')) {
            return { ...i, thumbnail_url: baseUrl + i.thumbnail_url }
        }
        return i
    }).filter(Boolean)
})


// 定义事件，用于在排序后通知父组件
const emit = defineEmits(['update:articleImages', 'add:file', 'remove:image']);
const draggedIndex = ref<number | null>(null);
// 拖拽开始
function onDragStart(index: number) {
    if (!props.upload) return;
    draggedIndex.value = index;
}
// 当拖拽经过时，必须阻止默认事件
function onDragOver(event: DragEvent) {
    if (!props.upload) return;
    event.preventDefault();
}
// 当放置时
function onDrop(targetIndex: number) {
    if (!props.upload || draggedIndex.value === null || draggedIndex.value === targetIndex) {
        return;
    }

    // 核心逻辑：计算出新的数组顺序并 emit 出去
    const fromIndex = draggedIndex.value;
    const newImages = [...props.articleImages]; // 复制一份，不要直接修改 prop

    [newImages[fromIndex], newImages[targetIndex]] = [newImages[targetIndex], newImages[fromIndex]];

    // 发出事件，将排序后的完整新数组传递给父组件
    emit('update:articleImages', newImages);
}

// 拖拽结束后清理状态
function onDragEnd() {
    draggedIndex.value = null;
}


const enlargedImage = ref<string | null>(null)

const showImage = (url: string) => {
    // if (props.upload) return;
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
        <!-- 添加文件 -->
        <div class="add-file" @click="$emit('add:file')"
            v-if="props.upload && articleImages.length === 0 && articleVideos.length === 0">
            <Icon>
                <Plus />
            </Icon>
        </div>

        <!-- 文章的图片展示 -->
        <ul v-if="articleImages.length !== 0">
            <li v-for="(image, index) in processedImages" :key="image.id" @click="showImage(image.image_url)"
                @dragstart="onDragStart(index)" @dragover="onDragOver" @drop="onDrop(index)" @dragend="onDragEnd">
                <div class="image-wrapper">
                    <img :src="image.image_url" alt="文章图片" @click="showImage(image.image_url)" />
                    <!-- 删除按钮 -->
                    <Icon class="delete-btn" v-if="props.upload" @click.stop="$emit('remove:image', index)">
                        <TrashAltRegular />
                    </Icon>
                </div>
            </li>
            <div class="add-file" @click="$emit('add:file')"
                v-if="props.upload && articleImages.length < Number(props.uploadNumber)">
                <Icon>
                    <Plus />
                </Icon>
            </div>
        </ul>
        <video v-if="processedVideos.length !== 0 && processedImages.length === 0" :src="processedVideos[0]?.video_url"
            ref="videoRef" :poster="processedVideos[0].thumbnail_url" muted playsinline controls>
        </video>
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

.image-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
}

.delete-btn {
    position: absolute;
    bottom: 5px;
    right: 5px;
    display: none;
    border: none;
    width: 24px;
    height: 24px;
    cursor: pointer;
    text-align: center;
}

.image-wrapper:hover .delete-btn {
    display: block;
}

.add-file {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    /* background-color: #f3f3f3; */
    background-color: var(--color-post-bar);
    width: 28%;
    aspect-ratio: 1/1;
    cursor: pointer;
    margin: 5px 0;
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