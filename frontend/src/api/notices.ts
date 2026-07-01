import request from './request'
import type { NoticeListResponse, NoticeType } from '@/types/notice'

export interface NoticeQuery {
  page?: number
  pageSize?: number
  read?: boolean
  type?: NoticeType
}

export const getNotices = (params: NoticeQuery) => {
  return request.get<NoticeListResponse>('/notices', { params })
}

export const getUnreadNoticeCount = () => {
  return request.get<{ count: number }>('/notices/unread-count')
}

export const markNoticeAsRead = (noticeId: string) => {
  return request.patch(`/notices/${noticeId}/read`)
}

export const markAllNoticesAsRead = () => {
  return request.patch('/notices/read-all')
}

export const deleteNotice = (noticeId: string) => {
  return request.delete(`/notices/${noticeId}`)
}
