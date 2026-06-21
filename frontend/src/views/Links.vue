<script setup lang="ts" name="Links">
import { onMounted, ref } from 'vue'
import { ChevronLeft } from '@vicons/fa'
import { Icon } from '@vicons/utils'
import { getLink } from '@/api/link'
import Brief from '@/components/Brief.vue'
import Header from '@/components/Header.vue'
import router from '@/router'
import { useDefaultStore } from '@/store/default'
import type { linkData } from '@/types/link'

const defaultStore = useDefaultStore()
const links = ref<linkData[]>([])
const isLoading = ref(false)
const loadFailed = ref(false)

function openUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

onMounted(async () => {
  isLoading.value = true
  loadFailed.value = false

  try {
    const res = await getLink()
    links.value = res.data
  } catch (error) {
    loadFailed.value = true
    console.error('加载链接数据失败:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="container">
    <Header>
      <template #left="{ isBlurred }">
        <Icon :class="['back-icon', { blurred: isBlurred }]" title="返回" @click="router.back()">
          <ChevronLeft />
        </Icon>
      </template>
    </Header>

    <Brief>
      <template #brief-content>
        {{ defaultStore.configs.link_brief || '欢迎访问这些朋友的站点' }}
      </template>
    </Brief>

    <main class="links-page">
      <section class="links-content">
        <h2>友情链接</h2>

        <div v-if="isLoading" class="state-text">正在加载友情链接...</div>
        <div v-else-if="loadFailed" class="state-text">友情链接加载失败，请稍后重试</div>
        <div v-else-if="links.length === 0" class="state-text">暂时还没有友情链接</div>

        <ul v-else class="link-list">
          <li v-for="link in links" :key="link.id">
            <button class="link-item" type="button" @click="openUrl(link.url)">
              <img :src="link.logo ? link.logo : '/img/avatar.jpg'" alt="友链LOGO">
              <span class="link-text">
                <span class="link-name">{{ link.sitename }}</span>
                <span class="link-brief">{{ link.brief ? link.brief : '暂时未设置站点介绍' }}</span>
              </span>
            </button>
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.back-icon {
  color: #EEE9E9;
  font-size: 22px;
  margin: 3px;
}

.back-icon:hover {
  color: #C8C2C2;
  cursor: pointer;
}

.back-icon.blurred {
  color: #898888;
}

.back-icon.blurred:hover {
  color: #5f5e5e;
}

.links-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 18px;
  box-sizing: border-box;
}

.links-content h2 {
  margin: 0 0 12px;
  font-size: 17px;
}

.state-text {
  padding: 24px 0;
  color: var(--color-text-other);
  text-align: center;
}

.link-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.link-list li + li {
  border-top: 1px solid rgba(128, 128, 128, 0.12);
}

.link-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 4px;
  border: 0;
  color: inherit;
  background: transparent;
  text-align: left;
  cursor: pointer;
  border-radius: 6px;
}

.link-item:hover {
  background-color: rgba(128, 128, 128, 0.12);
}

.link-item img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex: 0 0 auto;
}

.link-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 4px;
}

.link-name {
  font-weight: 600;
}

.link-brief {
  color: var(--color-text-other);
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}
</style>
