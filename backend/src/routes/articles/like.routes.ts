import { Router, Request, Response } from 'express'
import { Logger } from '../../utils/logger.js'
import { Prisma } from '@prisma/client'
import { logAction } from "../../services/log.service.js"
import { logger } from "../../services/log.service.js"
import { noticeService } from '../../services/notice.service.js'
import { optionalAuthMiddleware } from '../../middleware/optionalAuthMiddleware.js'
import { prisma } from '../../lib/prisma.js'
import { toBigInt } from '../../utils/parseId.js'

const routeLogger = new Logger('ArticlesLikeRoute')
const router = Router()

// 文章点赞
router.post('/:articleId/like', optionalAuthMiddleware, async (req: Request, res: Response) => {
    try {
        const articleId = toBigInt(req.params.articleId)
        if (articleId === null) {
            return res.status(400).json({ error: '文章ID不合法' })
        }

        // 检查文章是否存在
        const article = await prisma.articles.findFirst({
            where: {
                id: BigInt(articleId),
                status: 1,
                deleted_at: null
            }
        })
        if (!article) {
            logger.add({
                userId: null,
                action: logAction.LIKE_CREATE,
                targetType: 'likes',
                targetId: BigInt(articleId),
                status: 'FAILED',
                details: { error: '文章不存在或未发布' },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'] || '',
            })
            return res.status(404).json({ error: '文章不存在或未发布，点赞失败' })
        }
        // 根据登录状态执行不同的点赞逻辑
        if (req.user) {
            const userId = req.user.userId
            await prisma.$transaction([
                // 创建喜欢数据
                prisma.article_likes.create({
                    data: {
                        user_id: BigInt(userId),
                        article_id: BigInt(articleId)
                    }
                }),
                // 更新文章喜欢数
                prisma.articles.update({
                    where: {
                        id: BigInt(articleId)
                    },
                    data: {
                        like_count: {
                            increment: 1
                        }
                    }
                })
            ])
            await noticeService.createLikeNotice({
                fromUserId: BigInt(userId),
                articleAuthorId: article.user_id,
                articleId: BigInt(articleId),
                actorName: req.user.username,
            })
            logger.add({
                userId: null,
                action: logAction.LIKE_CREATE,
                targetType: 'likes',
                targetId: BigInt(articleId),
                details: { message: '点赞成功' },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'] || '',
            })
            return res.status(200).json({ message: '点赞成功' })
        } else {
            // 游客操作逻辑
            const guestId = req.headers['x-guest-id'] as string
            const ipAddress = req.ip
            if (!guestId) {
                return res.status(400).json({ error: '未提供游客id' })
            }
            // 简单ip验证
            const existingIp = await prisma.article_guest_likes.findFirst({
                where: {
                    article_id: BigInt(articleId),
                    ip_address: ipAddress
                }
            })
            if (existingIp) {
                logger.add({
                    userId: null,
                    action: logAction.LIKE_CREATE,
                    targetType: 'likes',
                    targetId: BigInt(articleId),
                    status: 'FAILED',
                    details: { message: '点赞失败，操作过于频繁，请稍后再试' },
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'] || '',
                })
                return res.status(429).json({ error: '操作过于频繁，请稍后再试' })
            }
            // 进行点赞操作处理
            await prisma.$transaction([
                // 创建游客喜欢表的记录
                prisma.article_guest_likes.create({
                    data: {
                        guest_id: guestId,
                        article_id: BigInt(articleId),
                        ip_address: ipAddress!
                    }
                }),
                // 更新文章点赞数
                prisma.articles.update({
                    where: { id: BigInt(articleId) },
                    data: { like_count: { increment: 1 } }
                })
            ])
            logger.add({
                userId: null,
                action: logAction.LIKE_CREATE,
                targetType: 'likes',
                targetId: BigInt(articleId),
                details: { message: '点赞成功' },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'] || '',
            })
            res.status(200).json({ message: '游客点赞成功' })
        }

    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: '已经点过赞了' })
        }
        routeLogger.error('点赞失败', error instanceof Error ? error.stack : String(error));
        res.status(500).json({ error: '服务器内部错误' })
    }
})

// 取消文章喜欢
router.delete('/:articleId/like', optionalAuthMiddleware, async (req: Request, res: Response) => {
    try {
        const articleId = toBigInt(req.params.articleId)
        if (articleId === null) {
            return res.status(400).json({ error: '文章ID不合法' })
        }

        if (req.user) {
            // 已登录用户的逻辑
            const userId = req.user.userId;
            await prisma.$transaction([
                prisma.article_likes.delete({
                    where: { user_id_article_id: { user_id: BigInt(userId), article_id: BigInt(articleId) } },
                }),
                prisma.articles.update({
                    where: { id: BigInt(articleId) },
                    data: { like_count: { decrement: 1 } },
                }),
            ]);
            logger.add({
                userId: null,
                action: logAction.LIKE_DELETE,
                targetType: 'likes',
                targetId: BigInt(articleId),
                details: { message: '取消点赞成功' },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'] || '',
            })
            return res.status(200).json({ message: '取消点赞成功' });
        } else {
            // 游客的逻辑
            const guestId = req.headers['x-guest-id'] as string;
            if (!guestId) {
                return res.status(400).json({ error: '游客ID未提供' });
            }

            await prisma.$transaction([
                prisma.article_guest_likes.delete({
                    // user_id_article_id 不是一个数据库字段，它是 Prisma 自动生成的 “复合主键 (Composite Primary Key)”
                    where: { guest_id_article_id: { guest_id: guestId, article_id: BigInt(articleId) } }
                }),
                prisma.articles.update({
                    where: { id: BigInt(articleId) },
                    data: { like_count: { decrement: 1 } },
                }),
            ])
            logger.add({
                userId: null,
                action: logAction.LIKE_DELETE,
                targetType: 'likes',
                targetId: BigInt(articleId),
                details: { message: '游客取消点赞成功' },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'] || '',
            })
            return res.status(200).json({ message: '游客取消点赞成功' });
        }
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: '您尚未点赞，无法取消' });
        }
        routeLogger.error('取消点赞失败:', error instanceof Error ? error.stack : String(error));
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 获取文章的点赞用户信息
router.get('/:articleId/like', optionalAuthMiddleware, async (req: Request, res: Response) => {
    try {
        const articleId = toBigInt(req.params.articleId)
        if (articleId === null) {
            return res.status(400).json({ error: '文章ID不合法' })
        }
        const likes = await prisma.article_likes.findMany({
            where: { article_id: BigInt(articleId) },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        nickname: true,
                        avatar: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        })
        //返回全部信息
        // const responseData2 = likes.map(like => ({
        //     ...like,
        //     user_id: like.user_id.toString(),
        //     article_id: like.article_id.toString(),
        //     user: {
        //         ...like.user,
        //         id: like.user.id.toString()
        //     }
        // }))
        //返回目前所需信息
        const responseData = likes.map(like => ({
            id: like.user_id.toString(),
            displayName: like.user.nickname || like.user.username,
            username: like.user.username,
            avatar: like.user.avatar
        }))
        res.status(200).json(responseData)
    } catch (error) {
        routeLogger.error('获取文章的点赞用户信息失败：', error instanceof Error ? error.stack : String(error));
        res.status(500).json({ error: '获取文章的点赞用户信息失败' });
    }
})
export default router
