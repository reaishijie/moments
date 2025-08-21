<script setup lang="ts" name="Header">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/store/user'
import { UserCircleRegular, Hive, Camera } from '@vicons/fa'
import { Icon } from '@vicons/utils'
import { useAuthStore } from '@/store/auth'
const authStore = useAuthStore()
const userStore = useUserStore()

// 默认背景图
const defaultBackground = '/img/background.mp4'

// 获取背景路径（优先使用用户配置）
const backgroundPath = computed(() => {
  return userStore.profile?.header_background || defaultBackground
})

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

// 顶栏
// 模糊
const isBlurred = ref(false)
let observer: IntersectionObserver | null = null

// 挂载时
onMounted(() => {
  const headerEl = document.querySelector('.header')
  if (headerEl) {
    observer = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        // entry.isIntersecting 是一个布尔值，表示目标元素是否在视口中。
        isBlurred.value = !entry.isIntersecting //在视口中就不模糊
      },
      {
        // root用于指定容器，null表示使用浏览器视口作为根容器
        root: null,
        // 触发函数：目标元素与根元素相交的比例 0- 1，0表示刚接触，1表示全部元素相交； 可以是一个数组多次触发[0, 0.5, 1]
        threshold: 0
      }
    )
    observer.observe(headerEl)
  }
})
onUnmounted(() => {
  observer && observer.disconnect()

})

// 根据token判断用户是否登录
const isLogin = computed(() => !!userStore.token)
</script>

<template>
  <div class="header">
    <div class="background">
      <img v-if="isImage" :src="backgroundPath" alt="顶部图片" />
      <video v-else-if="isVideo" :src="backgroundPath" autoplay muted loop playsinline />
      <video v-else :src="defaultBackground" autoplay muted loop playsinline />
    </div>
    <div class="top-bar-wrapper">
      <div :class="['top-bar', { blurred: isBlurred }]">
        <div class="top-bar-left">
          <Icon :class="['icon', { blurred: isBlurred }]">
          <UserCircleRegular @click="authStore.showAuth" v-if="!isLogin" />
        </Icon>
        </div>
        <div class="top-bar-right">
          <div class="addArticle">
            <Icon :class="['icon', { blurred: isBlurred }]" v-if="isLogin">
              <Camera />
            </Icon>
          </div>
          <div class="link">
            <Icon :class="['icon', { blurred: isBlurred }]">
            <Hive />
          </Icon>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 顶部容器 */
.header {
  width: 100%;
  height: 40vh;
  position: relative;
}


/* 背景 */
.background {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 顶部 图片/视频  */
.background img,
video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

/* 栏外层 */
.top-bar-wrapper {
  position: fixed;
  top: 0;
  width: min(100%, 550px);
  z-index: 10;
}

/* 栏本身 */
.top-bar {
  display: flex;
  justify-content: space-between;
  background-color: rgba(255, 255, 255, 0);
  transition: backdrop-filter 0.3s ease, background-color 0.3s ease;
  padding: 10px;
}

/* 模糊状态 */
.top-bar.blurred {
  backdrop-filter: blur(8px);
  background-color: rgba(234, 233, 233, 0.8);
}

.icon {
  font-size: 20px;
  color: rgb(238, 233, 233);
  margin: 3px;
}

.icon:hover {
  color: rgb(200, 194, 194);
  cursor: pointer;
}

.icon.blurred {
  font-size: 20px;
  color: black;
}

.icon.blurred:hover {
  color: rgb(81, 78, 78);
}

.top-bar-right {
  display: flex;
}
.addArticle {
  padding: 0 10px 0 0;
}
</style>