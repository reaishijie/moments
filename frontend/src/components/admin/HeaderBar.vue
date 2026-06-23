<script setup lang="ts" name="HeaderBar">
import { ref, computed } from 'vue'
import { Icon } from '@vicons/utils'
import { AngleDown } from '@vicons/fa'
import AvatarImage from '@/components/utils/AvatarImage.vue'
import router from '@/router'
import { useUserStore } from '@/store/user'
import { useMessageStore } from '@/store/message'
import { useRoute } from 'vue-router'

const route = useRoute()
const messageStore = useMessageStore()
const userStore = useUserStore()
const isShowSetting = ref(false)

const pageTitle = computed(() => route.matched[route.matched.length - 1]?.meta.title || '控制台')
const today = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }).format(new Date())

function handleLogout() {
  const id = messageStore.show('正在退出登录', 'loading')
  try {
    userStore.handleLogout()
    messageStore.update(id, { text: '退出登录成功', type: 'success', duration: 2000 })
    router.replace({ name: 'index' })
  } catch (error) {
    console.log('退出登录失败：', error)
    messageStore.update(id, { text: '退出登录失败', type: 'error', duration: 2000 })
  }
}
</script>

<template>
  <header class="admin-header">
    <div class="header-left">
      <h1>{{ pageTitle }}</h1>
      <div class="breadcrumb" aria-label="面包屑导航">
        <span v-for="(item, index) in route.matched" :key="index">
          <button class="breadcrumb-item" @click="router.push(item.path)">{{ item.meta.title }}</button>
          <span v-if="index < route.matched.length - 1" class="slash">/</span>
        </span>
      </div>
    </div>

    <div class="header-right">
      <span class="today">{{ today }}</span>

      <button class="user-trigger" @click="isShowSetting = !isShowSetting">
        <AvatarImage class="avatar" :src="userStore.profile?.avatar" alt="用户头像" />
        <span class="username">{{ userStore.profile?.username || '管理员' }}</span>
        <Icon class="down"><AngleDown /></Icon>
      </button>

      <Transition name="fade">
        <div v-if="isShowSetting" class="user-setting">
          <button @click="router.push({ name: 'admin' }); isShowSetting = false">控制台</button>
          <button @click="router.push({ name: 'admin-setting' }); isShowSetting = false">系统设置</button>
          <button class="danger" @click="handleLogout">退出登录</button>
        </div>
      </Transition>
    </div>
  </header>
</template>

<style scoped>
.admin-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 68px;
  padding: 12px 28px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-app);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.025);
}

.header-left {
  min-width: 0;
}

.header-left h1 {
  margin: 0 0 4px;
  color: var(--color-text-primary);
  font-size: 22px;
  font-weight: 600;
  line-height: 1.15;
}

.breadcrumb {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  color: #787878;
  font-size: 12px;
}

.breadcrumb-item,
.user-trigger,
.user-setting button {
  border: 0;
  outline: none;
  font: inherit;
  cursor: pointer;
}

.breadcrumb-item {
  padding: 0;
  color: inherit;
  background: transparent;
}

.breadcrumb-item:hover {
  color: #6cadf1;
}

.slash {
  color: #9ac3ef;
}

.header-right {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.today {
  color: #787878;
  font-size: 13px;
  white-space: nowrap;
}

.user-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 10px 0 5px;
  border-radius: 0;
  color: var(--color-text-primary);
  background: var(--color-ad);
  transition: background 0.2s ease, color 0.2s ease;
}

.user-trigger:hover {
  background: var(--color-ad-hover);
}

.avatar {
  display: block;
  width: 24px;
  height: 24px;
  border-radius: 0;
  object-fit: cover;
}

.username {
  max-width: 120px;
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.down {
  color: #787878;
}

.user-setting {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  display: flex;
  flex-direction: column;
  min-width: 140px;
  padding: 6px;
  border: 1px solid var(--color-border);
  border-radius: 0;
  background: var(--color-bg-app);
  box-shadow: var(--color-shadow);
}

.user-setting button {
  padding: 10px 12px;
  border-radius: 0;
  color: var(--color-text-primary);
  font-size: 14px;
  text-align: left;
  background: transparent;
}

.user-setting button:hover {
  background: var(--color-ad);
}

.user-setting .danger {
  color: #d95d6a;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 900px) {
  .today {
    display: none;
  }
}

@media (max-width: 768px) {
  .admin-header {
    min-height: 62px;
    padding: 10px 16px;
  }

  .header-left h1 {
    font-size: 20px;
  }

  .breadcrumb,
  .username {
    display: none;
  }
}
</style>
