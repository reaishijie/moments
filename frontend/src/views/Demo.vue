<script setup lang="ts" name="">
import { ref, reactive, watch } from 'vue'
import { ChevronLeft, MapMarkerAlt, Thumbtack, Ad, FileWord, Image, Video } from '@vicons/fa';
import { Icon } from '@vicons/utils';
import router from '@/router';
import { type createArticleData } from '@/types/article';
import { useMessageStore } from '@/store/message';
import { getLocation } from '@/utils/location';
import { createArticle } from '@/api/articles';

const messageStore = useMessageStore()
const articleData = reactive<createArticleData>({
  content: '',
  status: 1,
  location: '',
  type: 0,
  isTop: false,
  isAd: false,
  imageUrls: [],
  videoUrls: []
})
const imageData = ref('')

// 避免出现 过早优化（可以采用防抖）
watch(imageData, (newImageDataValue) => {
  const urls = newImageDataValue
  .split(/[\s,]+|[\n]+/)
  .map(url => url.trim())
  .filter(url => url)
  articleData.imageUrls = urls
})
function toggleIsTop() {
  if (!!articleData.isTop) {
    articleData.isTop = !articleData.isTop
    messageStore.show('取消文章置顶', 'success', 2000)
    return
  }
  articleData.isTop = !articleData.isTop
  messageStore.show('文章置顶', 'success', 2000)
}
function toggleIsAd() {
  if (!!articleData.isAd) {
    articleData.isAd = !articleData.isAd
    messageStore.show('取消文章为广告', 'success', 2000)
    return
  }
  articleData.isAd = !articleData.isAd
  messageStore.show('文章设置为广告', 'success', 2000)
}
function toggleType() {
  articleData.type = (articleData.type! + 1) % 3;
  if (articleData.type === 0) {
    messageStore.show('已切换到文本类型', 'success', 2000)
  } else if (articleData.type === 1) {
    messageStore.show('已切换到图片类型', 'success', 2000)
  } else {
    messageStore.show('已切换到视频类型', 'success', 2000)
  }
}
async function fetchLocation() {
  try {
    const res = await getLocation()
    articleData.location = res?.result.subdivisions + '省 · ' + res?.result.city
    messageStore.show('获取位置信息成功', 'success', 2000)
  } catch (error) {
    console.log(error);
    messageStore.show('获取位置信息失败', 'error', 2000)
  }
}
async function addArticle() {
  const id = messageStore.show('正在发表文章', 'loading')
  try {
    await createArticle(articleData)
    messageStore.update(id, {type: 'success', text: '发表成功', duration: 2000 })
  } catch(error) {
    console.log('创建文章失败', error)
    messageStore.update(id, {type: 'error', text: '发表失败', duration: 2000 })
  }
}
const adjustHeight = (event: Event) => {
  const textarea = event.target as HTMLTextAreaElement
  textarea.style.height = 'auto'
  textarea.style.height = textarea.scrollHeight + 'px'
}
</script>

<template>
  <div class="container">
    <div class="header">
      <div class="header-left" @click="router.back()">
        <div id="back">
          <Icon>
            <ChevronLeft />
          </Icon>
        </div>
        <div>发表文章</div>
      </div>
      <div class="header-right">
        <button @click="addArticle">发表</button>
      </div>
    </div>

    <div class="body">
      <textarea v-model="articleData.content" placeholder="这一刻的想法..." @input="adjustHeight" class="contentArea"></textarea>
      <div class="location">
        <div>
          <Icon @click="fetchLocation">
            <MapMarkerAlt />
          </Icon>
          <input type="text" placeholder="输入位置信息" v-model="articleData.location">
        </div>
      </div>
      <div class="func">
        <span :class="['func-item', { true: articleData.isTop }]" @click="toggleIsTop">
          <Icon>
            <Thumbtack />
          </Icon>
        </span>
        <span :class="['func-item', { true: articleData.isAd }]" @click="toggleIsAd">
          <Icon>
            <Ad />
          </Icon>
        </span>
        <span :class="['func-item', { true: articleData.type === 0 }]" @click="toggleType" v-if="articleData.type === 0">
          <Icon>
            <FileWord />
          </Icon>
        </span>
        <span :class="['func-item', { true: articleData.type === 1 }]" @click="toggleType" v-if="articleData.type === 1">
          <Icon>
            <Image />
          </Icon>
        </span>
        <span :class="['func-item', { true: articleData.type === 2 }]" @click="toggleType" v-if="articleData.type === 2">
          <Icon>
            <Video />
          </Icon>
        </span>
      </div>
        <textarea v-model="imageData" placeholder=" 输入图片链接" @input="adjustHeight" class="imageArea" v-if="articleData.type === 1"></textarea>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  min-width: 375px;
  width: 520px;
  background: #ffffff;
  min-height: 100vh;
}

/* 头部栏 */
.header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  height: 6vh;
  color: #00000098;
  background: #f3f3f3e8;
  padding: 0px 5px 0px 10px;
}

.header-left {
  display: flex;
  flex-direction: row;
  justify-content: center;
  padding: 10px;
  margin: 1px;
}

#back {
  padding: 1px 10px 1px 0;
}

#back:hover {
  color: #000000fb;
  background: #f0f0f08b;
  cursor: pointer;
  border-radius: 10px;
}

.header-right {
  display: flex;
  flex-direction: row;
  justify-content: center;
}

.header-right button {
  outline: none;
  border: none;
  background: #53b16a;
  color: #f0f0f0;
  padding: 5px 15px;
  border-radius: 5px;
}

.header-right button:hover {
  background: #4ea965;
  cursor: pointer;
}


.body {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.contentArea {
  border: none;
  resize: none;
  padding: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  min-height: 70px;
  height: 100px;
  max-height: 300px;
  overflow-y: auto;
}

.imageArea {
  border: none;
  resize: none;
  padding: 10px;
  font-size: smaller;
  
  font-weight: 600;
  color: #6cadf1;
  background: rgba(77, 76, 76, 0.075);
  min-height: 70px;
  height: 100px;
  max-height: 300px;
  overflow-y: auto;
  box-sizing: border-box;
  width: 95%;
  align-self: center;
}

textarea:focus {
  outline: none;
}

.func {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 5px 15px 5px 15px;
  gap: 8px;
}

.func-item {
  background: rgba(128, 128, 128, 0.075);
  padding: 5px 10px;
  color: #868686;
  cursor: pointer;
}

.func-item.true {
  color: #6cadf1;
}

.location {
  width: 100%;
  padding: 5px 15px 5px 15px;
  color: #6cadf1;
}

.location input {
  margin-left: 10px;
  outline: none;
  border: none;
  font-size: smaller;
  color: #6cacf1c9
}
</style>