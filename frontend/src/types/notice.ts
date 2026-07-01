export type NoticeType = 'SYSTEM' | 'COMMENT' | 'LIKE' | 'ALERT' | 'FOLLOW' | 'MESSAGE'

export interface NoticeSender {
  id: string
  username: string
  nickname?: string | null
  avatar?: string | null
}

export interface NoticeItem {
  id: string
  from: string | null
  to: string
  type: NoticeType
  title: string
  content: string
  target_type?: string | null
  target_id?: string | null
  link?: string | null
  read: boolean
  created_at: string
  read_at?: string | null
  sender?: NoticeSender | null
}

export interface NoticeListResponse {
  data: NoticeItem[]
  page: number
  pageSize: number
  total: number
}
