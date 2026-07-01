import { NoticeType, Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { Logger } from '../utils/logger.js'

const logger = new Logger('NoticeService')
const CONTENT_PREVIEW_LENGTH = 80

export type NoticeTargetType = 'article' | 'comment' | 'user' | 'system'

type CreateNoticeInput = {
  from?: bigint | string | number | null
  to: bigint | string | number
  type: NoticeType
  title: string
  content: string
  targetType?: NoticeTargetType
  targetId?: bigint | string | number | null
  link?: string | null
}

type NoticeQuery = {
  userId: bigint | string | number
  page?: number
  pageSize?: number
  read?: boolean
  type?: NoticeType
}

function toBigInt(value: bigint | string | number) {
  return typeof value === 'bigint' ? value : BigInt(value)
}

function preview(value: string) {
  const cleanValue = value.replace(/\s+/g, ' ').trim()
  return cleanValue.length > CONTENT_PREVIEW_LENGTH
    ? `${cleanValue.slice(0, CONTENT_PREVIEW_LENGTH)}...`
    : cleanValue
}

function serializeNotice<T extends Prisma.noticesGetPayload<{ include: typeof noticeInclude }>>(notice: T) {
  return {
    ...notice,
    id: notice.id.toString(),
    from: notice.from?.toString() ?? null,
    to: notice.to.toString(),
    target_id: notice.target_id?.toString() ?? null,
    sender: notice.sender ? {
      ...notice.sender,
      id: notice.sender.id.toString(),
    } : null,
  }
}

const noticeInclude = {
  sender: {
    select: {
      id: true,
      username: true,
      nickname: true,
      avatar: true,
    },
  },
} satisfies Prisma.noticesInclude

export const noticeService = {
  async createNotice(input: CreateNoticeInput) {
    const from = input.from == null ? null : toBigInt(input.from)
    const to = toBigInt(input.to)

    if (from && from === to) return null

    try {
      return await prisma.notices.create({
        data: {
          from,
          to,
          type: input.type,
          title: input.title,
          content: input.content,
          target_type: input.targetType,
          target_id: input.targetId == null ? null : toBigInt(input.targetId),
          link: input.link,
        },
      })
    } catch (error) {
      logger.error('创建通知失败', error instanceof Error ? error.stack : String(error))
      return null
    }
  },

  async createCommentNotice(params: {
    fromUserId: bigint | string | number
    articleAuthorId: bigint | string | number
    articleId: bigint | string | number
    actorName: string
    content: string
  }) {
    return this.createNotice({
      from: params.fromUserId,
      to: params.articleAuthorId,
      type: NoticeType.COMMENT,
      title: '有人评论了你的瞬刻',
      content: `${params.actorName}：${preview(params.content)}`,
      targetType: 'article',
      targetId: params.articleId,
      link: `/article/${params.articleId.toString()}`,
    })
  },

  async createReplyNotice(params: {
    fromUserId: bigint | string | number
    replyToUserId: bigint | string | number
    articleId: bigint | string | number
    commentId: bigint | string | number
    actorName: string
    content: string
  }) {
    return this.createNotice({
      from: params.fromUserId,
      to: params.replyToUserId,
      type: NoticeType.COMMENT,
      title: '有人回复了你的评论',
      content: `${params.actorName}：${preview(params.content)}`,
      targetType: 'comment',
      targetId: params.commentId,
      link: `/article/${params.articleId.toString()}`,
    })
  },

  async createLikeNotice(params: {
    fromUserId: bigint | string | number
    articleAuthorId: bigint | string | number
    articleId: bigint | string | number
    actorName: string
  }) {
    return this.createNotice({
      from: params.fromUserId,
      to: params.articleAuthorId,
      type: NoticeType.LIKE,
      title: '有人喜欢了你的瞬刻',
      content: `${params.actorName} 点赞了你的内容`,
      targetType: 'article',
      targetId: params.articleId,
      link: `/article/${params.articleId.toString()}`,
    })
  },

  async createSystemNotice(params: {
    to: bigint | string | number
    title: string
    content: string
    link?: string | null
  }) {
    return this.createNotice({
      from: null,
      to: params.to,
      type: NoticeType.SYSTEM,
      title: params.title,
      content: params.content,
      targetType: 'system',
      link: params.link,
    })
  },

  async listUserNotices(query: NoticeQuery) {
    const page = Math.max(query.page || 1, 1)
    const pageSize = Math.min(Math.max(query.pageSize || 10, 1), 50)
    const where: Prisma.noticesWhereInput = {
      to: toBigInt(query.userId),
      deleted_at: null,
      ...(query.read !== undefined ? { read: query.read } : {}),
      ...(query.type ? { type: query.type } : {}),
    }

    const [items, total] = await prisma.$transaction([
      prisma.notices.findMany({
        where,
        include: noticeInclude,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notices.count({ where }),
    ])

    return {
      data: items.map(serializeNotice),
      page,
      pageSize,
      total,
    }
  },

  async getUnreadCount(userId: bigint | string | number) {
    return prisma.notices.count({
      where: {
        to: toBigInt(userId),
        read: false,
        deleted_at: null,
      },
    })
  },

  async markAsRead(userId: bigint | string | number, noticeId: bigint | string | number) {
    const result = await prisma.notices.updateMany({
      where: {
        id: toBigInt(noticeId),
        to: toBigInt(userId),
        deleted_at: null,
      },
      data: {
        read: true,
        read_at: new Date(),
      },
    })
    return result.count > 0
  },

  async markAllAsRead(userId: bigint | string | number) {
    return prisma.notices.updateMany({
      where: {
        to: toBigInt(userId),
        read: false,
        deleted_at: null,
      },
      data: {
        read: true,
        read_at: new Date(),
      },
    })
  },

  async deleteNotice(userId: bigint | string | number, noticeId: bigint | string | number) {
    const result = await prisma.notices.updateMany({
      where: {
        id: toBigInt(noticeId),
        to: toBigInt(userId),
        deleted_at: null,
      },
      data: {
        deleted_at: new Date(),
      },
    })
    return result.count > 0
  },
}
