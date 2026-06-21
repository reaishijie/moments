<script setup lang="ts" name="Links">
import { computed, onMounted, ref } from 'vue'
import { getLink } from '@/api/link'
import { useDefaultStore } from '@/store/default'
import type { linkData } from '@/types/link'

const defaultStore = useDefaultStore()
const links = ref<linkData[]>([])
const isLoading = ref(false)
const loadFailed = ref(false)

const siteLogo = computed(() => {
  return defaultStore.configs.site_logo || defaultStore.configs.site_avatar || '/img/avatar.jpg'
})

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
  <main class="links-page">
    <section class="links-hero">
      <img class="site-logo" :src="siteLogo" alt="站点LOGO">
      <div class="site-info">
        <h1>{{ defaultStore.configs.sitename || '友情链接' }}</h1>
        <p>{{ defaultStore.configs.link_brief || '欢迎访问这些朋友的站点' }}</p>
      </div>
    </section>

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
</template>

<style scoped>
.links-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  padding: 18px;
  box-sizing: border-box;
}

.links-hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 0;
  border-bottom: 1px solid rgba(128, 128, 128, 0.18);
}

.site-logo {
  width: 54px;
  height: 54px;
  border-radius: 8px;
  object-fit: cover;
  flex: 0 0 auto;
}

.site-info {
  min-width: 0;
}

.site-info h1 {
  margin: 0;
  font-size: 20px;
  line-height: 1.3;
}

.site-info p {
  margin: 6px 0 0;
  color: var(--color-text-other);
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
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
