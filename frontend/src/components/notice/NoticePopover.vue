<script setup lang="ts" name="NoticePopover">
import { computed, onBeforeUnmount, ref } from 'vue'
import { Bell, CommentRegular, HeartRegular, ExclamationCircle, CheckCircleRegular } from '@vicons/fa'
import { Icon } from '@vicons/utils'
import AvatarImage from '@/components/utils/AvatarImage.vue'
import EmojiText from '@/components/emoji/EmojiText.vue'
import router from '@/router'
import { getNotices } from '@/api/notices'
import { useMessageStore } from '@/store/message'
import { useNoticeStore } from '@/store/notice'
import { showTime } from '@/utils/time'
import type { NoticeItem, NoticeType } from '@/types/notice'

const props = defineProps<{
  isBlurred?: boolean
}>()

const noticeStore = useNoticeStore()
const messageStore = useMessageStore()
const isOpen = ref(false)
const loading = ref(false)
const latestNotices = ref<NoticeItem[]>([])
const popoverRef = ref<HTMLElement | null>(null)

const badgeText = computed(() => noticeStore.unreadCount > 99 ? '99+' : String(noticeStore.unreadCount))

async function loadLatestNotices() {
  loading.value = true
  try {
    const response = await getNotices({ page: 1, pageSize: 6 })
    latestNotices.value = response.data.data
    await noticeStore.fetchUnreadCount()
  } catch (error) {
    messageStore.show('获取通知失败', 'error', 2000)
  } finally {
    loading.value = false
  }
}

function togglePanel() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    void loadLatestNotices()
    window.setTimeout(() => document.addEventListener('click', handleOutsideClick), 0)
  } else {
    document.removeEventListener('click', handleOutsideClick)
  }
}

function closePanel() {
  isOpen.value = false
  document.removeEventListener('click', handleOutsideClick)
}

function handleOutsideClick(event: MouseEvent) {
  if (!popoverRef.value?.contains(event.target as Node)) {
    closePanel()
  }
}

async function openNotice(notice: NoticeItem) {
  if (!notice.read) {
    await noticeStore.markAsRead(notice.id)
    notice.read = true
  }
  closePanel()
  if (notice.link) {
    router.push(notice.link)
  }
}

async function markAllRead() {
  try {
    await noticeStore.markAllAsRead()
    latestNotices.value.forEach(notice => {
      notice.read = true
      notice.read_at = notice.read_at || new Date().toISOString()
    })
    messageStore.show('已全部标记为已读', 'success', 1600)
  } catch (error) {
    messageStore.show('操作失败，请稍后重试', 'error', 2000)
  }
}

function viewAll() {
  closePanel()
  router.push({ name: 'notifications' })
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

onBeforeUnmount(() => document.removeEventListener('click', handleOutsideClick))
</script>

<template>
  <div ref="popoverRef" class="notice-popover">
    <button type="button" class="notice-trigger" title="消息通知" @click.stop="togglePanel">
      <Icon :class="['icon', { blurred: props.isBlurred }]">
        <Bell />
      </Icon>
      <span v-if="noticeStore.unreadCount" class="notice-badge">{{ badgeText }}</span>
    </button>

    <div v-if="isOpen" class="notice-panel" @click.stop>
      <div class="panel-head">
        <div>
          <strong>消息通知</strong>
          <span>{{ noticeStore.unreadCount ? `${noticeStore.unreadCount} 条未读` : '暂无未读' }}</span>
        </div>
        <button type="button" :disabled="noticeStore.unreadCount === 0" @click="markAllRead">
          <Icon size="12px"><CheckCircleRegular /></Icon>
          全部已读
        </button>
      </div>

      <div v-if="loading" class="panel-state">正在加载消息...</div>
      <div v-else-if="latestNotices.length === 0" class="panel-state">暂时没有消息</div>
      <ul v-else class="notice-list">
        <li
          v-for="notice in latestNotices"
          :key="notice.id"
          :class="['notice-item', { unread: !notice.read }]"
          @click="openNotice(notice)"
        >
          <AvatarImage class="notice-avatar" :src="notice.sender?.avatar" :alt="displayName(notice)" />
          <div class="notice-body">
            <div class="notice-title-row">
              <span class="notice-title">
                <Icon class="notice-type" size="13px">
                  <component :is="getNoticeIcon(notice.type)" />
                </Icon>
                {{ notice.title }}
              </span>
              <span class="notice-time">{{ showTime(new Date(notice.created_at).getTime()) }}</span>
            </div>
            <p><EmojiText :text="notice.content" /></p>
          </div>
          <span v-if="!notice.read" class="unread-dot"></span>
        </li>
      </ul>

      <button type="button" class="view-all" @click="viewAll">查看全部消息</button>
    </div>
  </div>
</template>

<style scoped>
.notice-popover {
  position: relative;
  display: inline-flex;
  padding: 0 10px 0 0;
}

.notice-trigger,
.panel-head button,
.view-all {
  border: 0;
  cursor: pointer;
}

.notice-trigger {
  position: relative;
  display: inline-flex;
  padding: 0;
  background: transparent;
}

.icon {
  font-size: 20px;
  color: #EEE9E9;
  margin: 3px;
}

.icon:hover {
  color: #C8C2C2;
}

.icon.blurred {
  color: #898888;
}

.icon.blurred:hover {
  color: #5f5e5e;
}

.notice-badge {
  position: absolute;
  top: -4px;
  right: -2px;
  min-width: 15px;
  height: 15px;
  padding: 0 4px;
  border-radius: 999px;
  background: #f56c6c;
  color: #fff;
  font-size: 10px;
  line-height: 15px;
  text-align: center;
  box-sizing: border-box;
}

.notice-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: -28px;
  z-index: 9999;
  width: min(286px, calc(100vw - 28px));
  max-height: min(410px, 68vh);
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  background: var(--color-bg-app);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}

.notice-panel::before {
  content: '';
  position: absolute;
  top: -6px;
  right: 36px;
  width: 10px;
  height: 10px;
  border-left: 1px solid var(--color-border);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-app);
  transform: rotate(45deg);
}

.panel-head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border);
}

.panel-head strong {
  display: block;
  color: var(--color-text-primary);
  font-size: 14px;
}

.panel-head span {
  color: #888;
  font-size: 12px;
}

.panel-head button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 4px 7px;
  border-radius: 4px;
  background: var(--color-ad);
  color: #6cadf1;
  font-size: 12px;
}

.panel-head button:hover:not(:disabled) {
  background: var(--color-ad-hover);
}

.panel-head button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.panel-state {
  padding: 28px 0;
  color: #888;
  font-size: 13px;
  text-align: center;
}

.notice-list {
  max-height: 300px;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.notice-item {
  position: relative;
  display: flex;
  gap: 8px;
  padding: 10px 18px 10px 12px;
  border-bottom: 1px solid var(--color-border);
  transition: background-color 0.2s ease;
}

.notice-item:hover {
  background: var(--color-ad);
  cursor: pointer;
}

.notice-item.unread {
  background: rgba(108, 173, 241, 0.06);
}

.notice-avatar {
  width: 32px;
  height: 32px;
  border-radius: 5%;
  flex-shrink: 0;
  object-fit: cover;
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
  gap: 4px;
  min-width: 0;
  overflow: hidden;
  color: #586C97;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.notice-type {
  flex-shrink: 0;
  color: #6cadf1;
}

.notice-time {
  flex-shrink: 0;
  color: #888;
  font-size: 11px;
}

.notice-body p {
  display: -webkit-box;
  margin: 4px 0 0;
  overflow: hidden;
  color: var(--color-text-primary);
  font-size: 12px;
  line-height: 1.5;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.unread-dot {
  position: absolute;
  top: 13px;
  right: 7px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f56c6c;
}

.view-all {
  width: 100%;
  padding: 10px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-app);
  color: #6cadf1;
  font-size: 13px;
}

.view-all:hover {
  background: var(--color-ad);
}
</style>
