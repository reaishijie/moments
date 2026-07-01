<script setup lang="ts" name="Notifications">
import { computed, onMounted, ref } from 'vue'
import { ChevronLeft, Bell, CommentRegular, HeartRegular, ExclamationCircle, TrashAltRegular, CheckCircleRegular } from '@vicons/fa'
import { Icon } from '@vicons/utils'
import Header from '@/components/Header.vue'
import Brief from '@/components/Brief.vue'
import AvatarImage from '@/components/utils/AvatarImage.vue'
import EmojiText from '@/components/emoji/EmojiText.vue'
import router from '@/router'
import { useNoticeStore } from '@/store/notice'
import { useMessageStore } from '@/store/message'
import { showTime } from '@/utils/time'
import type { NoticeItem, NoticeType } from '@/types/notice'

const noticeStore = useNoticeStore()
const messageStore = useMessageStore()
const activeFilter = ref<'all' | 'unread' | NoticeType>('all')

const filters = [
  { key: 'all', label: '全部' },
  { key: 'unread', label: '未读' },
  { key: 'COMMENT', label: '评论' },
  { key: 'LIKE', label: '点赞' },
  { key: 'SYSTEM', label: '系统' },
] as const

const briefText = computed(() => noticeStore.unreadCount ? `你有 ${noticeStore.unreadCount} 条未读消息` : '所有消息都已经读完啦')

function getFilterQuery() {
  if (activeFilter.value === 'unread') return { read: false }
  if (activeFilter.value === 'all') return {}
  return { type: activeFilter.value as NoticeType }
}

async function loadNotices(reset = false) {
  try {
    await noticeStore.fetchNotices({ reset, ...getFilterQuery() })
    await noticeStore.fetchUnreadCount()
  } catch (error) {
    messageStore.show('获取通知失败', 'error', 2000)
  }
}

async function changeFilter(filter: typeof activeFilter.value) {
  activeFilter.value = filter
  await loadNotices(true)
}

async function handleNoticeClick(notice: NoticeItem) {
  if (!notice.read) {
    await noticeStore.markAsRead(notice.id)
  }
  if (notice.link) {
    router.push(notice.link)
  }
}

async function markAllRead() {
  try {
    await noticeStore.markAllAsRead()
    messageStore.show('已全部标记为已读', 'success', 2000)
  } catch (error) {
    messageStore.show('操作失败，请稍后重试', 'error', 2000)
  }
}

async function removeNotice(noticeId: string) {
  try {
    await noticeStore.removeNotice(noticeId)
    messageStore.show('通知已删除', 'success', 1600)
  } catch (error) {
    messageStore.show('删除失败，请稍后重试', 'error', 2000)
  }
}

function getNoticeIcon(type: NoticeType) {
  if (type === 'COMMENT') return CommentRegular
  if (type === 'LIKE') return HeartRegular
  if (type === 'ALERT') return ExclamationCircle
  return Bell
}

function displayName(notice: NoticeItem) {
  return notice.sender?.nickname || notice.sender?.username || '系统通知'
}

onMounted(() => {
  void loadNotices(true)
})
</script>

<template>
  <div class="notifications-container">
    <Header>
      <template #left="{ isBlurred }">
        <Icon :class="['back-icon', { blurred: isBlurred }]" title="返回" @click="router.back()">
          <ChevronLeft />
        </Icon>
      </template>
    </Header>

    <Brief>
      <template #brief-content>{{ briefText }}</template>
    </Brief>

    <main class="notice-page">
      <div class="notice-head">
        <div>
          <h2>消息通知</h2>
          <p>查看评论、点赞和系统消息</p>
        </div>
        <button class="read-all" type="button" :disabled="noticeStore.unreadCount === 0" @click="markAllRead">
          <Icon size="13px"><CheckCircleRegular /></Icon>
          全部已读
        </button>
      </div>

      <div class="filter-row">
        <button
          v-for="filter in filters"
          :key="filter.key"
          type="button"
          :class="['filter-chip', { active: activeFilter === filter.key }]"
          @click="changeFilter(filter.key)"
        >
          {{ filter.label }}
        </button>
      </div>

      <div v-if="noticeStore.loading && noticeStore.notices.length === 0" class="state-text">正在加载消息...</div>
      <div v-else-if="noticeStore.notices.length === 0" class="state-text">暂时没有消息</div>

      <ul v-else class="notice-list">
        <li
          v-for="notice in noticeStore.notices"
          :key="notice.id"
          :class="['notice-item', { unread: !notice.read }]"
          @click="handleNoticeClick(notice)"
        >
          <AvatarImage class="notice-avatar" :src="notice.sender?.avatar" :alt="displayName(notice)" />
          <div class="notice-body">
            <div class="notice-title-row">
              <span class="notice-title">
                <Icon class="notice-type-icon" size="14px">
                  <component :is="getNoticeIcon(notice.type)" />
                </Icon>
                {{ notice.title }}
              </span>
              <span class="notice-time">{{ showTime(new Date(notice.created_at).getTime()) }}</span>
            </div>
            <div class="notice-sender">{{ displayName(notice) }}</div>
            <p class="notice-content"><EmojiText :text="notice.content" /></p>
          </div>
          <button class="delete-btn" type="button" title="删除" @click.stop="removeNotice(notice.id)">
            <Icon size="13px"><TrashAltRegular /></Icon>
          </button>
          <span v-if="!notice.read" class="unread-dot"></span>
        </li>
      </ul>

      <button
        v-if="noticeStore.hasMore"
        class="load-more"
        type="button"
        :disabled="noticeStore.loading"
        @click="loadNotices(false)"
      >
        {{ noticeStore.loading ? '加载中...' : '加载更多' }}
      </button>
    </main>
  </div>
</template>

<style scoped>
.notifications-container {
  display: flex;
  flex-direction: column;
}

.back-icon {
  font-size: 20px;
  color: #EEE9E9;
  margin: 3px;
  cursor: pointer;
}

.back-icon.blurred {
  color: #898888;
}

.notice-page {
  padding: 14px 14px 28px;
}

.notice-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.notice-head h2 {
  margin: 0 0 4px;
  font-size: 20px;
}

.notice-head p {
  margin: 0;
  color: #888;
  font-size: 12px;
}

.read-all,
.load-more,
.filter-chip,
.delete-btn {
  border: 0;
  cursor: pointer;
}

.read-all {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 7px 10px;
  border-radius: 5px;
  background: #53b16a;
  color: #fff;
  font-size: 12px;
}

.read-all:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.filter-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 12px 0;
}

.filter-chip {
  flex-shrink: 0;
  padding: 5px 10px;
  border-radius: 999px;
  background: var(--color-ad);
  color: #868686;
  font-size: 12px;
}

.filter-chip.active {
  background: #6cadf1;
  color: #fff;
}

.state-text {
  padding: 30px 0;
  color: #888;
  font-size: 13px;
  text-align: center;
}

.notice-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.notice-item {
  position: relative;
  display: flex;
  gap: 10px;
  padding: 12px 34px 12px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-app);
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.notice-item:hover {
  background: var(--color-ad);
  transform: translateY(-1px);
  cursor: pointer;
}

.notice-item.unread {
  border-color: #9ac3ef;
}

.notice-avatar {
  width: 38px;
  height: 38px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.notice-body {
  min-width: 0;
  flex: 1;
}

.notice-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.notice-title {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  color: #586C97;
  font-size: 14px;
  font-weight: 600;
}

.notice-type-icon {
  color: #6cadf1;
}

.notice-time,
.notice-sender {
  color: #888;
  font-size: 12px;
}

.notice-time {
  flex-shrink: 0;
}

.notice-sender {
  margin-top: 4px;
}

.notice-content {
  margin: 6px 0 0;
  color: var(--color-text-primary);
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
}

.delete-btn {
  position: absolute;
  top: 10px;
  right: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: transparent;
  color: #aaa;
}

.delete-btn:hover {
  background: rgba(245, 108, 108, 0.12);
  color: #f56c6c;
}

.unread-dot {
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f56c6c;
}

.load-more {
  width: 100%;
  margin-top: 12px;
  padding: 10px;
  border-radius: 6px;
  background: var(--color-ad);
  color: #6cadf1;
}
</style>
