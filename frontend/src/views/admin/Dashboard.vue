<script setup lang="ts" name="Dashboard">
import { computed, onMounted, ref } from 'vue'
import { getUserCount, getArticleCount, getCommentCount } from '@/api/admin'
import { Icon } from '@vicons/utils'
import { UserCircleRegular, Buffer, CommentRegular, ShieldAlt, SyncAlt } from '@vicons/fa'
import router from '@/router'

interface CountData {
  message: string
  totalCount: number
  activeCount: number
  negativeCount: number
}


const counts = ref<{
  userCount: CountData | null
  articleCount: CountData | null
  commentCount: CountData | null
}>({
  userCount: null,
  articleCount: null,
  commentCount: null,
})
const isLoading = ref(true)
const loadError = ref('')

const statCards = computed(() => [
  {
    key: 'users',
    label: '用户',
    value: counts.value.userCount?.activeCount || 0,
    total: counts.value.userCount?.totalCount || 0,
    inactive: counts.value.userCount?.negativeCount || 0,
    route: 'admin-user',
    icon: UserCircleRegular,
  },
  {
    key: 'articles',
    label: '文章',
    value: counts.value.articleCount?.activeCount || 0,
    total: counts.value.articleCount?.totalCount || 0,
    inactive: counts.value.articleCount?.negativeCount || 0,
    route: 'admin-article',
    icon: Buffer,
  },
  {
    key: 'comments',
    label: '评论',
    value: counts.value.commentCount?.activeCount || 0,
    total: counts.value.commentCount?.totalCount || 0,
    inactive: counts.value.commentCount?.negativeCount || 0,
    route: 'admin-comment',
    icon: CommentRegular,
  },
])

const totalActive = computed(() => statCards.value.reduce((sum, item) => sum + item.value, 0))
const totalRecords = computed(() => statCards.value.reduce((sum, item) => sum + item.total, 0))

const quickActions = [
  { label: '审核内容', desc: '筛选、置顶或删除文章', route: 'admin-article', icon: Buffer },
  { label: '管理用户', desc: '调整状态、角色和资料', route: 'admin-user', icon: UserCircleRegular },
  { label: '评论治理', desc: '检索并处理回复内容', route: 'admin-comment', icon: CommentRegular },
  { label: '站点设置', desc: '配置公开信息与偏好', route: 'admin-seeting-site', icon: ShieldAlt },
]

const languages: Record<string, { name: string; icon: string; href?: string }> = {
  HTML: {
    name: 'html',
    icon: 'https://img.shields.io/badge/HTML-239120?style=for-the-badge&logo=html5&logoColor=white',
  },
  CSS: {
    name: 'css',
    icon: 'https://img.shields.io/badge/CSS-239120?&style=for-the-badge&logo=css3&logoColor=white',
  },
  JavaScript: {
    name: 'javascript',
    icon: 'https://img.shields.io/badge/JavaScript-2CA550?style=for-the-badge&logo=JavaScript&logoColor=white',
  },
  TypeScript: {
    name: 'typescript',
    icon: 'https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white',
  },
  Vue: {
    name: 'vue',
    icon: 'https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vue.js&logoColor=4FC08D',
  },
  Axios: {
    name: 'axios',
    icon: 'https://img.shields.io/badge/Axios-%23039BE5.svg?&style=for-the-badge&logo=Axios&logoColor=white',
  },
  Pinia: {
    name: 'pinia',
    icon: 'https://img.shields.io/badge/Pinia-43853D?style=for-the-badge&logo=pinia&logoColor=#FBCE4B',
  },
  Shell: {
    name: 'shell',
    icon: 'https://img.shields.io/badge/Powershell-2CA5E0?style=for-the-badge&logo=powershell&logoColor=white',
  },
  NodeJs: {
    name: 'nodejs',
    icon: 'https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white',
  },
  NPM: {
    name: 'npm',
    icon: 'https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white',
  },
  Docker: {
    name: 'docker',
    icon: 'https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white',
  },
  Vercel: {
    name: 'vercel',
    icon: 'https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white',
  },
}

async function getAllCount() {
  isLoading.value = true
  loadError.value = ''
  try {
    const [userCount, articleCount, commentCount] = await Promise.all([
      getUserCount(),
      getArticleCount(),
      getCommentCount(),
    ])
    counts.value.userCount = userCount.data
    counts.value.articleCount = articleCount.data
    counts.value.commentCount = commentCount.data
  } catch (error) {
    loadError.value = '统计数据暂时无法加载，请稍后重试。'
    throw error
  } finally {
    isLoading.value = false
  }
}

onMounted(getAllCount)
</script>

<template>
  <section class="dashboard-page">
    <div class="summary-card">
      <div class="summary-main">
        <span class="section-label">控制台概览</span>
        <h2>站点运行状态</h2>
        <p>查看内容、用户和评论的当前状态，快速进入常用管理页面。</p>
      </div>

      <div class="summary-actions">
        <button class="refresh-btn" @click="getAllCount" :disabled="isLoading">
          <Icon><SyncAlt /></Icon>
          {{ isLoading ? '刷新中' : '刷新' }}
        </button>
      </div>
    </div>

    <div v-if="loadError" class="error-banner">{{ loadError }}</div>

    <div class="stats-panel">
      <div class="panel-title">
        <h3>数据统计</h3>
        <span>总活跃 {{ totalActive }} / 总记录 {{ totalRecords }}</span>
      </div>

      <div class="stats-list" :class="{ loading: isLoading }">
        <button v-for="item in statCards" :key="item.key" class="stat-row" @click="router.push({ name: item.route })">
          <span class="stat-icon"><Icon><component :is="item.icon" /></Icon></span>
          <span class="stat-name">{{ item.label }}：</span>
          <strong>{{ item.value }}</strong>
          <span class="stat-desc">总计 {{ item.total }}，异常/停用 {{ item.inactive }}</span>
        </button>
      </div>
    </div>

    <div class="work-grid">
      <section class="panel-card">
        <div class="panel-title">
          <h3>快捷入口</h3>
          <span>常用操作</span>
        </div>
        <div class="quick-list">
          <button v-for="action in quickActions" :key="action.label" @click="router.push({ name: action.route })">
            <Icon><component :is="action.icon" /></Icon>
            <span>
              <strong>{{ action.label }}</strong>
              <small>{{ action.desc }}</small>
            </span>
          </button>
        </div>
      </section>

      <section class="panel-card project-card">
        <h1>瞬刻后台管理页面</h1>
        <div class="project-label">仓库地址：</div>
        <a
          class="github-badge"
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/reaishijie/moments"
        >
          <img
            src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white"
            alt="GitHub"
          >
        </a>
        <div class="project-label">语言及工具：</div>
        <span class="languages">
          <img v-for="language in languages" :key="language.name" :src="language.icon" :alt="language.name">
        </span>
      </section>
    </div>
  </section>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-card,
.stats-panel,
.panel-card,
.error-banner {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 0;
  background: var(--color-bg-app);
  box-shadow: var(--color-shadow);
}

.summary-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 28px;
}

.section-label,
.panel-title span {
  color: #787878;
  font-size: 13px;
}

.summary-main h2 {
  margin: 6px 0 8px;
  color: var(--color-text-primary);
  font-size: 24px;
  font-weight: 600;
}

.summary-main p {
  margin: 0;
  color: #787878;
  font-size: 14px;
  line-height: 1.7;
}

.summary-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 0 0 auto;
}

.refresh-btn,
.stat-row,
.quick-list button {
  border: 0;
  outline: none;
  font: inherit;
  cursor: pointer;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 0;
  color: #ffffff;
  background: #09C362;
}

.refresh-btn:hover:not(:disabled) {
  background: #f8bc99;
}

.refresh-btn:disabled,
.stats-list.loading {
  opacity: 0.65;
}

.error-banner {
  padding: 12px 16px;
  color: #d95d6a;
  background: color-mix(in srgb, #d95d6a 8%, var(--color-bg-app));
}

.stats-panel,
.panel-card {
  padding: 20px 28px;
}

.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
}

.panel-title h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 18px;
  font-weight: 600;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 54px;
  padding: 8px 10px;
  border-radius: 0;
  color: var(--color-text-primary);
  text-align: left;
  background: transparent;
  transition: background 0.2s ease;
}

.stat-row:hover {
  background: var(--color-ad);
}

.stat-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  color: #6cadf1;
  background: transparent;
}

.stat-name {
  width: 72px;
  color: var(--color-text-primary);
  font-weight: 500;
}

.stat-row strong {
  width: 64px;
  color: #6cadf1;
  font-size: 24px;
  line-height: 1;
}

.stat-desc {
  color: #787878;
  font-size: 13px;
}

.work-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.8fr);
  gap: 16px;
}

.quick-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quick-list button {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 10px;
  border-radius: 0;
  color: var(--color-text-primary);
  text-align: left;
  background: transparent;
  transition: background 0.2s ease;
}

.quick-list button:hover {
  background: var(--color-ad);
}

.quick-list .xicon {
  flex: 0 0 auto;
  color: #6cadf1;
}

.quick-list strong,
.quick-list small {
  display: block;
}

.quick-list strong {
  font-weight: 500;
}

.quick-list small {
  margin-top: 3px;
  color: #787878;
  font-size: 12px;
}

.project-card h1 {
  margin: 0 0 16px;
  color: var(--color-text-primary);
  font-size: 20px;
  font-weight: 600;
}

.project-label {
  margin: 14px 0 8px;
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: 500;
}

.github-badge {
  display: inline-flex;
  line-height: 0;
}

.github-badge img,
.languages img {
  display: block;
  height: 28px;
  max-width: 145px;
  transition: transform 0.2s ease, filter 0.2s ease;
}

.github-badge:hover img,
.languages img:hover {
  transform: translateY(-2px);
  filter: brightness(1.05);
}

.languages {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

@media (max-width: 900px) {
  .summary-card,
  .summary-actions {
    align-items: flex-start;
    flex-direction: column;
  }

  .work-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .summary-card,
  .stats-panel,
  .panel-card {
    padding: 16px;
  }

  .panel-title,
  .stat-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .stat-name,
  .stat-row strong {
    width: auto;
  }
}
</style>
