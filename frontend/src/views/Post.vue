<script setup lang="ts" name="Post">
import { nextTick, ref, reactive, watch } from 'vue'
import { ChevronLeft, MapMarkerAlt, Thumbtack, Ad, FileWord, Image, Video, ExchangeAlt, Tags, Times } from '@vicons/fa';
import { Icon } from '@vicons/utils';
import router from '@/router';
import { type createArticleData } from '@/types/article';
import { useMessageStore } from '@/store/message';
import { getLocation } from '@/utils/location';
import { createArticle } from '@/api/articles';
import { useUserStore } from '@/store/user';
import Upload from '@/components/utils/Upload.vue';
import EmojiPicker from '@/components/emoji/EmojiPicker.vue';

const userStore = useUserStore()
const messageStore = useMessageStore()
const articleData = reactive<createArticleData>({
  content: '',
  status: 1,
  location: '',
  type: 0,
  isTop: false,
  isAd: false,
  adTitle: '',
  adUrl: '',
  imageUrls: [],
  videoUrls: [],
  thumbnail_url: '',
  tags: []
})
const imageData = ref('')
const videoData = ref('')
const contentTextarea = ref<HTMLTextAreaElement | null>(null)
const tagInput = ref('')
const states = reactive({
  location: false,
  add: false
})
// 展示 false是为上传内容， true时为填写外链
const displayMethod = ref(false)
function toggleDisplayMethod() {
  if (articleData.type === 0) {
    messageStore.show('纯文字内容无需切换', 'info', 2000)
  } else {
    displayMethod.value = !displayMethod.value
    if (displayMethod.value) {
      messageStore.show('已切换为外链', 'success', 2000)
    } else {
      messageStore.show('已切换为上传文件', 'success', 2000)
    }
  }
}

// 避免出现 过早优化（可以采用防抖）
watch(imageData, (newImageDataValue) => {
  const urls = newImageDataValue
    .split(/[\s,]+|[\n]+/)
    .map(url => url.trim())
    .filter(url => url)
  articleData.imageUrls = urls
})
watch(videoData, (newVideoDataValue) => {
  const urls = newVideoDataValue
    .split(/[\s,]+|[\n]+/)
    .map(url => url.trim())
    .filter(url => url)
  articleData.videoUrls = urls
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
    imageData.value = ''
    videoData.value = ''
    messageStore.show('已切换为文本类型', 'success', 2000)
  } else if (articleData.type === 1) {
    imageData.value = ''
    videoData.value = ''
    messageStore.show('已切换为图片类型', 'success', 2000)
  } else {
    imageData.value = ''
    videoData.value = ''
    messageStore.show('已切换为视频类型', 'success', 2000)
  }
}
async function fetchLocation() {
  if (states.location) {
    messageStore.show('请勿重复点击', 'info', 2000)
    return
  }
  const id = messageStore.show('正在获取位置信息', 'loading')
  try {
    states.location = true
    const res = await getLocation()
    const locationText = res?.text || ''
    if (!locationText) {
      messageStore.update(id, { type: 'info', text: '未获取到位置信息', duration: 2000 })
      return
    }
    articleData.location = locationText
    messageStore.update(id, { type: 'success', text: '获取位置信息成功', duration: 2000 })
  } catch (error) {
    console.log(error);
    messageStore.update(id, { type: 'error', text: '获取位置信息失败', duration: 2000 })
  } finally {
    states.location = false
  }
}
const uploadRef = ref<InstanceType<typeof Upload> | null>();
const videoUploadRef = ref<InstanceType<typeof Upload> | null>();
const coverUploadRef = ref<InstanceType<typeof Upload> | null>();
async function addArticle() {
  const hasUploadFiles = !displayMethod.value && (
    !!uploadRef.value?.hasSelectedFiles() ||
    !!videoUploadRef.value?.hasSelectedFiles() ||
    !!coverUploadRef.value?.hasSelectedFiles()
  )
  const hasUploadVideo = !displayMethod.value && !!videoUploadRef.value?.hasSelectedVideo()
  if (!articleData.content && (!articleData.imageUrls?.length || articleData.imageUrls.length === 0) &&
    (!articleData.videoUrls?.length || articleData.videoUrls.length === 0) && !hasUploadFiles) {
    messageStore.show('文章内容不能为空', 'info', 2000)
    return
  }
  if (articleData.type === 2 && !articleData.videoUrls?.length && !hasUploadVideo) {
    messageStore.show('请选择视频文件或填写视频链接', 'info', 2000)
    return
  }
  if (states.add) {
    messageStore.show('请勿重复点击', 'info', 2000)
    return
  }
  const id = messageStore.show('正在发表文章', 'loading')
  try {
    states.add = true
    const res = await createArticle(articleData)
    if (articleData.type === 2 && !displayMethod.value) {
      await videoUploadRef.value?.performUpload(res.data.id)
      if (coverUploadRef.value?.hasSelectedFiles()) {
        await coverUploadRef.value.performUpload(res.data.id)
      }
    } else {
      await uploadRef.value?.performUpload(res.data.id)
    }
    
    // 清空内容
    articleData.content = ''
    articleData.location = ''
    articleData.imageUrls = []
    articleData.videoUrls = []
    articleData.thumbnail_url = ''
    articleData.adTitle = ''
    articleData.adUrl = ''
    articleData.tags = []
    imageData.value = ''
    videoData.value = ''
    tagInput.value = ''
    messageStore.update(id, { type: 'success', text: '发表成功', duration: 2000 })

    if (!userStore.profile?.username) {
      await userStore.fetchUserProfile()
    }
    const username = userStore.profile?.username
    if (username) {
      router.replace({ name: 'home', params: { username }, query: { from: 'post' } })
    }
  } catch (error) {
    console.log('发表文章失败', error)
    messageStore.update(id, { type: 'error', text: '发表失败', duration: 2000 })
  } finally {
    states.add = false
  }
}
const adjustHeight = (event: Event) => {
  const textarea = event.target as HTMLTextAreaElement
  textarea.style.height = 'auto'
  textarea.style.height = textarea.scrollHeight + 'px'
}
async function insertEmoji(code: string) {
  const textarea = contentTextarea.value
  if (!textarea) {
    articleData.content += code
    return
  }

  const start = textarea.selectionStart ?? articleData.content.length
  const end = textarea.selectionEnd ?? start
  articleData.content = `${articleData.content.slice(0, start)}${code}${articleData.content.slice(end)}`

  await nextTick()
  textarea.focus()
  const cursor = start + code.length
  textarea.setSelectionRange(cursor, cursor)
  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight}px`
}
function addTag(name: string) {
  const tagName = name.trim().replace(/^#+/, '').slice(0, 50)
  if (!tagName || articleData.tags?.includes(tagName)) return
  if ((articleData.tags?.length || 0) >= 5) {
    messageStore.show('最多添加5个标签', 'info', 2000)
    return
  }
  articleData.tags = [...(articleData.tags || []), tagName]
}
function commitTagInput() {
  const tags = tagInput.value.split(/[\s,，#]+/).filter(Boolean)
  tags.forEach(addTag)
  tagInput.value = ''
}
function handleTagInput() {
  if (/[\s,，#]/.test(tagInput.value)) {
    commitTagInput()
  }
}
function removeTag(name: string) {
  articleData.tags = (articleData.tags || []).filter(tag => tag !== name)
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
      <textarea ref="contentTextarea" v-model="articleData.content" placeholder="这一刻的想法..." @input="adjustHeight"
        class="contentArea"></textarea>
      <!-- 上传文件 -->
      <Upload v-if="articleData.type === 1 && !displayMethod" ref="uploadRef" :article-type="articleData.type"></Upload>
      <div v-if="articleData.type === 2 && !displayMethod" class="video-upload-section">
        <div class="upload-field">
          <div class="upload-label">视频文件</div>
          <Upload ref="videoUploadRef" :article-type="articleData.type" upload-role="video"></Upload>
        </div>
        <div class="upload-field">
          <div class="upload-label">封面图片</div>
          <Upload ref="coverUploadRef" :article-type="articleData.type" upload-role="cover"></Upload>
        </div>
      </div>
      <div class="field-row location">
        <Icon class="field-icon" size="16px" @click="fetchLocation" title="点击获取位置信息">
          <MapMarkerAlt />
        </Icon>
        <input type="text" placeholder="输入位置信息（可为空）" v-model="articleData.location">
      </div>
      <div class="field-row tag-input">
        <Icon class="field-icon field-icon-tag" size="14px">
          <Tags />
        </Icon>
        <div class="tag-editor">
          <button type="button" class="tag-chip" v-for="tag in articleData.tags" :key="tag" @click="removeTag(tag)">
            <span>#{{ tag }}</span>
            <Icon class="tag-remove">
              <Times />
            </Icon>
          </button>
          <input type="text" placeholder="输入标签，空格或逗号生成" v-model="tagInput"
            @input="handleTagInput" @keydown.enter.prevent="commitTagInput" @blur="commitTagInput">
        </div>
      </div>
      <div class="func">
        <EmojiPicker placement="bottom" @select="insertEmoji" />
        <!-- 管理员正常操作 -->
        <span :class="['func-item', { true: articleData.isTop }]"
          @click="Number(userStore.profile?.role) === 1 ? toggleIsTop() : messageStore.show('权限不足', 'info', 2000)"
          title="文章置顶">
          <Icon>
            <Thumbtack />
          </Icon>
        </span>

        <span :class="['func-item', { true: articleData.isAd }]"
          @click="Number(userStore.profile?.role) === 1 ? toggleIsAd() : messageStore.show('权限不足', 'info', 2000)"
          title="文章推广">
          <Icon>
            <Ad />
          </Icon>
        </span>

        <span class="func-item true" @click="toggleType"
          title="文章类型">
            <Icon v-if="articleData.type === 0">
              <FileWord />
            </Icon>
            <Icon v-else-if="articleData.type === 1">
              <Image />
            </Icon>
            <Icon v-else-if="articleData.type === 2">
              <Video />
            </Icon>
        </span>

        <span :class="['func-item', { true: displayMethod }]" @click="toggleDisplayMethod" title="上传类型">
          <Icon>
            <ExchangeAlt />
          </Icon>
        </span>
      </div>
      <div class="media-input">
        <input type="text" v-if="articleData.isAd" v-model="articleData.adTitle" placeholder="输入广告标题，如：瞬刻"
          class="textArea">
        <input type="text" v-if="articleData.isAd" v-model="articleData.adUrl"
          placeholder="输入广告链接，如：https://example.com" class="textArea">
        <textarea v-model="imageData" placeholder=" 输入图片链接(使用“,”、空格、换行 区分图片)" @input="adjustHeight" class="mediaArea"
          v-if="articleData.type === 1 && displayMethod"></textarea>
        <input v-model="videoData" placeholder=" 输入视频链接" @input="adjustHeight" class="textArea"
          v-if="articleData.type === 2 && displayMethod"></input>
        <input v-model="articleData.thumbnail_url" placeholder=" 输入视频封面链接" @input="adjustHeight" class="textArea"
          v-if="articleData.type === 2 && displayMethod"></input>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  width: 100%;
  background: var(--color-bg-app);
}

/* 头部栏 */
.header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  height: 6vh;
  color: var(--color-text-primary);
  /* background: #f3f3f3e8; */
  background-color: var(--color-post-bar);
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
  margin-right: 5px;
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

.video-upload-section {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 5px;
}

.upload-field {
  width: 28%;
  min-width: 0;
}

.upload-label {
  color: #6cadf1;
  font-size: 12px;
  margin: 0 0 5px 0;
}

.upload-field :deep(.upload-container) {
  width: 100%;
  margin: 0;
}

.upload-field :deep(ul) {
  width: 100%;
}

.upload-field :deep(.add-file),
.upload-field :deep(li),
.upload-field :deep(video) {
  width: 100%;
  aspect-ratio: 1 / 1;
  margin: 0;
}

.upload-field :deep(video) {
  background-color: var(--color-post-bar);
  object-fit: cover;
}

.upload-field :deep(img) {
  margin: 0;
}

.contentArea {
  border: none;
  resize: none;
  padding: 10px;
  color: var(--color-text-primary);
  background-color: var(--color-bg-app);
  min-height: 70px;
  height: 100px;
  max-height: 300px;
  overflow-y: auto;
}

.mediaArea {
  border: none;
  resize: none;
  padding: 10px;
  margin: 5px 2.5%;
  font-size: smaller;
  font-weight: 600;
  color: #6cadf1;
  background-color: var(--color-bg-app);
  min-height: 70px;
  height: 100px;
  max-height: 300px;
  overflow-y: auto;
  box-sizing: border-box;
  width: 95%;
  align-self: center;
}

.textArea {
  border: none;
  resize: none;
  padding: 8px;
  margin: 5px 2.5%;
  font-size: smaller;
  font-weight: 300;
  color: #6cadf1;
  background-color: var(--color-bg-app);
  overflow-y: auto;
  overflow-x: scroll;
  box-sizing: border-box;
  width: 95%;
}

textarea:focus {
  outline: none;
}

input:focus {
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

.field-row {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 10px;
  padding: 5px 15px 5px 20px;
  color: #6cadf1;
  box-sizing: border-box;
}

.field-icon {
  width: 16px;
  height: 20px;
  min-width: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  cursor: pointer;
}

.field-icon :deep(svg) {
  width: 16px;
  height: 16px;
}

.field-icon-tag :deep(svg) {
  width: 14px;
  height: 14px;
}

.location input {
  flex: 1;
  height: 20px;
  padding: 0;
  outline: none;
  border: none;
  font-size: smaller;
  line-height: 20px;
  color: #6cacf1c9;
  background-color: inherit;
  min-width: 0;
}

.tag-editor {
  display: flex;
  flex: 1;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
  min-height: 20px;
}

.tag-editor input {
  flex: 1;
  height: 20px;
  padding: 0;
  outline: none;
  border: none;
  font-size: smaller;
  line-height: 20px;
  color: #6cacf1c9;
  background-color: inherit;
  min-width: 120px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  border-radius: 3px;
  background-color: var(--color-ad);
  color: #4E6086;
  padding: 1px 5px;
  font-size: 12px;
  line-height: 20px;
  cursor: pointer;
}

.tag-chip:hover {
  background-color: var(--color-ad-hover);
}

.tag-remove {
  font-size: 10px;
}
</style>
