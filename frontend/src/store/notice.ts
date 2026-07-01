import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { deleteNotice as apiDeleteNotice, getNotices, getUnreadNoticeCount, markAllNoticesAsRead, markNoticeAsRead } from '@/api/notices'
import type { NoticeItem, NoticeType } from '@/types/notice'

export const useNoticeStore = defineStore('notice', () => {
  const notices = ref<NoticeItem[]>([])
  const unreadCount = ref(0)
  const page = ref(1)
  const pageSize = ref(10)
  const total = ref(0)
  const loading = ref(false)
  const currentRead = ref<boolean | undefined>(undefined)
  const currentType = ref<NoticeType | undefined>(undefined)

  const hasMore = computed(() => notices.value.length < total.value)

  async function fetchUnreadCount() {
    const response = await getUnreadNoticeCount()
    unreadCount.value = response.data.count
  }

  async function fetchNotices(options: { reset?: boolean, read?: boolean, type?: NoticeType } = {}) {
    if (loading.value) return
    loading.value = true
    try {
      if (options.reset) {
        page.value = 1
        notices.value = []
      }
      currentRead.value = options.read
      currentType.value = options.type

      const response = await getNotices({
        page: page.value,
        pageSize: pageSize.value,
        read: currentRead.value,
        type: currentType.value,
      })
      total.value = response.data.total
      notices.value = options.reset ? response.data.data : [...notices.value, ...response.data.data]
      page.value += 1
    } finally {
      loading.value = false
    }
  }

  async function markAsRead(noticeId: string) {
    await markNoticeAsRead(noticeId)
    const notice = notices.value.find(item => item.id === noticeId)
    if (notice && !notice.read) {
      notice.read = true
      notice.read_at = new Date().toISOString()
      unreadCount.value = Math.max(unreadCount.value - 1, 0)
    }
  }

  async function markAllAsRead() {
    await markAllNoticesAsRead()
    notices.value.forEach(notice => {
      notice.read = true
      notice.read_at = notice.read_at || new Date().toISOString()
    })
    unreadCount.value = 0
  }

  async function removeNotice(noticeId: string) {
    await apiDeleteNotice(noticeId)
    const notice = notices.value.find(item => item.id === noticeId)
    notices.value = notices.value.filter(item => item.id !== noticeId)
    total.value = Math.max(total.value - 1, 0)
    if (notice && !notice.read) {
      unreadCount.value = Math.max(unreadCount.value - 1, 0)
    }
  }

  return {
    notices,
    unreadCount,
    page,
    pageSize,
    total,
    loading,
    hasMore,
    fetchUnreadCount,
    fetchNotices,
    markAsRead,
    markAllAsRead,
    removeNotice,
  }
})
