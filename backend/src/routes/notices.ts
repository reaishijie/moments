import { NoticeType } from '@prisma/client'
import { Router, Request, Response } from 'express'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { noticeService } from '../services/notice.service.js'

const router = Router()

function parseNoticeType(value: unknown) {
  if (typeof value !== 'string') return undefined
  return Object.values(NoticeType).includes(value as NoticeType) ? value as NoticeType : undefined
}

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const read = req.query.read === undefined ? undefined : req.query.read === 'true'
    const type = parseNoticeType(req.query.type)

    if (req.query.type && !type) {
      return res.status(400).json({ error: '无效的通知类型' })
    }

    const result = await noticeService.listUserNotices({
      userId: req.user!.userId,
      page,
      pageSize,
      read,
      type,
    })
    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({ error: '获取通知失败' })
  }
})

router.get('/unread-count', authMiddleware, async (req: Request, res: Response) => {
  try {
    const count = await noticeService.getUnreadCount(req.user!.userId)
    return res.status(200).json({ count })
  } catch (error) {
    return res.status(500).json({ error: '获取未读通知数失败' })
  }
})

router.patch('/read-all', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await noticeService.markAllAsRead(req.user!.userId)
    return res.status(200).json({ message: '已全部标记为已读', count: result.count })
  } catch (error) {
    return res.status(500).json({ error: '标记通知失败' })
  }
})

router.patch('/:noticeId/read', authMiddleware, async (req: Request, res: Response) => {
  try {
    const success = await noticeService.markAsRead(req.user!.userId, req.params.noticeId)
    if (!success) return res.status(404).json({ error: '通知不存在' })
    return res.status(200).json({ message: '已标记为已读' })
  } catch (error) {
    return res.status(500).json({ error: '标记通知失败' })
  }
})

router.delete('/:noticeId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const success = await noticeService.deleteNotice(req.user!.userId, req.params.noticeId)
    if (!success) return res.status(404).json({ error: '通知不存在' })
    return res.status(204).send()
  } catch (error) {
    return res.status(500).json({ error: '删除通知失败' })
  }
})

export default router
