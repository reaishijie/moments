<script setup lang="ts" name="Home">
import { onMounted, ref, reactive, computed } from 'vue'
import Header from '@/components/Header.vue';
import Brief from '@/components/Brief.vue';
import HomeArticleItem from '@/components/article/HomeArticleItem.vue'
import { ChevronLeft, Cog, AngleDown } from '@vicons/fa';
import { Icon } from '@vicons/utils';
import router from '@/router';
import { useRoute } from 'vue-router';
import { useMessageStore } from '@/store/message';
import { getUserIdByUsername } from '@/api/users';
import { getArticle } from '@/api/articles';
import type { articleData } from '@/types/article';


const messageStore = useMessageStore()
const route = useRoute()
const username = route.params.username
const userId = ref(1)
const displayName = ref('')
const avatar = ref('')
const header_background = ref('')
const brief = ref('')

const userArticle = reactive<articleData[]>([])
const pagination = reactive({
  total: 0,
  currentPage: 1,
  pageSize: 5,
  isLoading: false
})

const hasMore = computed(() => {
  return userArticle.length < pagination.total
})
const fetchArticles = async (userId: number) => {
  if (pagination.isLoading) return
  pagination.isLoading = true
  const id = messageStore.show('正在加载文章', 'loading')
  try {
    const res = await getArticle({ page: pagination.currentPage, pageSize: pagination.pageSize, userId })

    userArticle.push(...res.data.data)
    pagination.total = res.data.total
    pagination.currentPage++
    messageStore.update(id, { 'type': 'success', 'text': '加载成功', 'duration': 2000 })
  } catch (error) {
    console.error('获取用户文章失败', error)
    messageStore.update(id, { 'type': 'error', 'text': '加载失败', 'duration': 2000 })
  } finally {
    pagination.isLoading = false
  }
}

onMounted(async () => {
  try {
    const res = await getUserIdByUsername(username)
    userId.value = res.data.id
    displayName.value = res.data.nickname ?? username
    avatar.value = res.data.avatar ?? '/img/avatar.jpg'
    header_background.value = res.data.header_background ?? '/img/background.avif'
    avatar.value = res.data.avatar
    if (userId.value) {
      await fetchArticles(userId.value)
    }
    document.title = `${displayName.value}的主页 - ${import.meta.env.VITE_APP_TITLE}`
  } catch (error) {
    console.error('获取用户文章失败', error);
    messageStore.show('加载用户文章失败', 'error', 2000)
  }
})
</script>

<template>
  <div class="container">
    <div class="top-bar">
      <Header>
        <template #left="{ isBlurred }">
          <div class="top-bar-left">
            <Icon :class="['icon', { blurred: isBlurred }]" @click="router.back()">
              <ChevronLeft />
            </Icon>
          </div>
        </template>

        <template #right="{ isBlurred }">
          <div class="profile">
            <Icon :class="['icon', { blurred: isBlurred }]" @click="router.push({ name: 'profile' })">
              <Cog />
            </Icon>
          </div>
        </template>
      </Header>
    </div>
    <div class="brief">
      <Brief>
        <template #brief-img>
          <span>{{ displayName }}</span>
          <img :src="avatar" alt="avatar" @click="router.push({ name: 'profile'})">
        </template>
        <template #brief-content>
          {{ brief }}
        </template>
      </Brief>
    </div>
    <div class="content-container">
      <!-- 简略文章展示 -->
      <div class="content-main">
        <ul>
          <li v-for="article in userArticle" :key="article.id">
            <!-- 每篇文章都循环使用 template 进行展示 -->
            <HomeArticleItem :article="article" />
          </li>
        </ul>
      </div>
      <div class="content-footer">
        <div v-if="pagination.isLoading" class="status-indicator">正在加载中...</div>
        <div v-if="hasMore && !pagination.isLoading" @click="fetchArticles(userId)" class="status-indicator">
          加载更多
          <Icon>
            <AngleDown />
          </Icon>
        </div>
        <div v-if="!hasMore && userArticle.length > 0" class="status-indicator">- 没有更多了 -</div>
        <div v-if="userArticle.length === 0" class="status-indicator">- 该用户还没有发表内容哦 -</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  width: 100%;
  background: rgb(255, 255, 255);
}
.brief span {
    padding: 5px;
    color: rgb(255, 255, 255, 0.9);
    margin-top: -35px;
    margin-right: 10px;
    z-index: 5;
    font-size: large;
    font-weight: 600;
}
/* 简介头像 */
.brief img {
    border-radius: 10%;
    width: 60px;
    height: 60px;
    margin-top: -40px;
    margin-right: 25px;
    z-index: 5;
}

.brief img:hover {
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
/* bar的图标 */
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

/* 内容 */
.content-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* 文章主内容 */
.content-main {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.content-main ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.content-footer {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.status-indicator {
  color: #25252574;
  margin-left: 10px;
  transition: color 0.3s, font-size 0.3s;
  height: 20px;
  font-size: smaller;
}

.status-indicator:hover {
  cursor: pointer;
  color: #bbd7f4;
}
</style>