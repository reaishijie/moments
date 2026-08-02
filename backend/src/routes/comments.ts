import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { logAction, logger } from "../services/log.service.js"
import { noticeService } from "../services/notice.service.js"
import { Logger } from "../utils/logger.js"


const router = Router()
const routeLogger = new Logger('CommentRoute')

const MAX_PAGE_SIZE = 100

// 创建一条评论 需要登录
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId
        const { articleId, content, parentId } = req.body

        // 验证登录态
        if (!userId) {
            return res.status(401).json({ error: '未登录' })
        }
        // 验证输入
        if (!articleId || !content) {
            return res.status(400).json({ error: '文章ID和评论内容不能为空' })
        }
        let parentComment: {
            id: bigint,
            user_id: bigint,
            article_id: bigint,
            user: { nickname: string | null, username: string }
        } | null = null
        // 子评论
        if (parentId) {
            // 父评论
            parentComment = await prisma.comments.findUnique({
                where: { id: BigInt(parentId) },
                select: {
                    id: true,
                    user_id: true,
                    article_id: true,
                    user: { select: { nickname: true, username: true } }
                }
            });

            // 检查父评论是否存在
            if (!parentComment) {
                return res.status(404).json({ error: '您回复的评论不存在' });
            }

            // 检查父评论的文章ID是否与当前提交的文章ID一致
            if (parentComment.article_id.toString() !== articleId.toString()) {
                return res.status(400).json({ error: '回复的评论与文章不匹配' });
            }
        }

        // 验证文章状态
        const article = await prisma.articles.findFirst({
            where: {
                id: BigInt(articleId),
                status: 1,
                //后续可以拓展文章是否开启评论
                deleted_at: null
            }
        })
        if (!article) {
            return res.status(404).json({ error: '文章不存在或未发布' })
        }
        // 使用 prisma 事务来保证数据一致性（都成功/失败）
        const [newComment, updateArticle] = await prisma.$transaction([
            // 创建新评论
            prisma.comments.create({
                data: {
                    content,
                    article: { connect: { id: BigInt(articleId) } },
                    user: { connect: { id: BigInt(userId!) } },
                    ...(parentId && { parent: { connect: { id: BigInt(parentId) } } })
                },
                include: {
                    user: {
                        select: { id: true, username: true, nickname: true, avatar: true}
                    }
                }
            }),
            // 更新文章评论计数
            prisma.articles.update({
                where: { id: BigInt(articleId) },
                data: {
                    comment_count: {
                        increment: 1, //原子性地加一
                    }
                }
            })
        ])
        // 构建返回数据
        const responseData = {
            id: newComment.id.toString(),
            content: newComment.content,
            created_at: newComment.created_at,
            updated_at: newComment.updated_at,
            article_id: newComment.article_id.toString(),
            user_id: newComment.user_id.toString(),
            parent_id: newComment.parent_id?.toString() ?? null,
            parent_displayName: parentComment?.user.nickname ?? parentComment?.user.username ?? null,
            replies: [],
            user: {
                ...newComment.user,
                id: newComment.user.id.toString()
            }
        }
        const actorName = newComment.user.nickname ?? newComment.user.username
        if (parentComment) {
            await noticeService.createReplyNotice({
                fromUserId: BigInt(userId!),
                replyToUserId: parentComment.user_id,
                articleId: article.id,
                commentId: newComment.id,
                actorName,
                content,
            })
        }
        if (!parentComment || parentComment.user_id !== article.user_id) {
            await noticeService.createCommentNotice({
                fromUserId: BigInt(userId!),
                articleAuthorId: article.user_id,
                articleId: article.id,
                actorName,
                content,
            })
        }
        logger.add({
            userId: null,
            action: logAction.COMMENT_CREATE,
            targetType: 'comments',
            targetId: BigInt(articleId),
            details: responseData,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || '',
        })
        res.status(201).json(responseData)
    } catch (error) {
        routeLogger.error('创建评论失败', error instanceof Error ? error.stack : String(error));
        res.status(500).json({ error: '服务器内部错误' });
    }
})

// 删除自己的评论同时删除该评论的所有子评论
router.delete('/:commentId', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId
        const { commentId } = req.params
        // 验证登录态
        if (!userId) {
            return res.status(401).json({ error: '未登录' })
        }
        // 查找需要删除的评论是否存在
        const comment = await prisma.comments.findUnique({
            where: { id: BigInt(commentId) }
        })
        // 检验是否存在
        if (!comment || comment.deleted_at !== null) {
            return res.status(404).json({ error: '评论不存在或已被删除' });
        }
        // 检验是否是本人
        if (comment?.user_id.toString() !== userId?.toString()) {
            return res.status(403).json({ error: '权限不足，禁止操作' })
        }
        // 查找所有评论id
        const list: bigint[] = []
        // 查找的起始id
        let item: bigint[] = [BigInt(commentId)]
        while (item.length > 0) {
            // 将所有评论id放入list数组中
            list.push(...item)
            // 查找所有的子评论id
            const replies = await prisma.comments.findMany({
                where: {
                    parent_id: { in: item },
                    article_id: comment.article_id,
                    deleted_at: null
                },
                select: {
                    // 只返回id
                    id: true
                }
            })
            item = replies.map(i => i.id)
        }
        // 事务处理
        await prisma.$transaction([
            //删除所有评论
            prisma.comments.updateMany({
                where: { id: { in: list } },
                data: {
                    deleted_at: new Date(),
                },
            }),
            // 更新文章的评论数
            prisma.articles.update({
                where: {
                    id: comment?.article_id
                },
                data: {
                    comment_count: {
                        decrement: list.length
                    }
                }
            })
        ])
        logger.add({
            userId: null,
            action: logAction.COMMENT_DELETE,
            targetType: 'comments',
            targetId: BigInt(commentId),
            details: { comment: comment, deleteCommentList: list },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || '',
        })
        res.status(204).send()
    } catch (error) {
        routeLogger.error('删除评论失败', error instanceof Error ? error.stack : String(error));
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 获取文章评论：按父评论分页，回复固定收拢到对应父评论下（最多展示两层）
router.get('/:articleId', async (req: Request, res: Response) => {
    try {
        const { articleId } = req.params
        const page = Math.max(1, parseInt(req.query.page as string) || 1)
        const rawPageSize = parseInt(req.query.pageSize as string) || 5
        const pageSize = Math.min(Math.max(1, rawPageSize), MAX_PAGE_SIZE)
        const skip = (page - 1) * pageSize

        const rootComments = await prisma.comments.findMany({
            where: {
                article_id: BigInt(articleId),
                parent_id: null,
                deleted_at: null
            },
            orderBy: { created_at: 'asc' },
            skip,
            take: pageSize,
            include: {
                user: {
                    select: { id: true, username: true, nickname: true, avatar: true }
                }
            }
        })

        const rootIds = rootComments.map(comment => comment.id)
        const allReplies = rootIds.length > 0 ? await prisma.comments.findMany({
            where: {
                article_id: BigInt(articleId),
                parent_id: { not: null },
                deleted_at: null
            },
            orderBy: { created_at: 'asc' },
            include: {
                user: {
                    select: { id: true, username: true, nickname: true, avatar: true }
                },
                parent: {
                    include: {
                        user: {
                            select: { id: true, username: true, nickname: true, avatar: true }
                        }
                    }
                }
            }
        }) : []

        const rootIdSet = new Set(rootIds.map(id => id.toString()))
        const commentMap = new Map(allReplies.map(comment => [comment.id.toString(), comment]))
        const repliesByRootId = new Map<string, typeof allReplies>()

        const findRootId = (comment: typeof allReplies[number]): string | null => {
            let parentId = comment.parent_id?.toString() ?? null
            const visited = new Set<string>()
            while (parentId) {
                if (rootIdSet.has(parentId)) return parentId
                if (visited.has(parentId)) return null
                visited.add(parentId)
                parentId = commentMap.get(parentId)?.parent_id?.toString() ?? null
            }
            return null
        }

        for (const reply of allReplies) {
            const rootId = findRootId(reply)
            if (!rootId) continue
            const list = repliesByRootId.get(rootId) || []
            list.push(reply)
            repliesByRootId.set(rootId, list)
        }

        const totalRootComments = await prisma.comments.count({
            where: { article_id: BigInt(articleId), parent_id: null, deleted_at: null }
        })

        const serializeComment = (comment: typeof rootComments[number] | typeof allReplies[number]) => {
            const parentDisplayName = 'parent' in comment
                ? comment.parent?.user.nickname ?? comment.parent?.user.username ?? null
                : null
            return {
                id: comment.id.toString(),
                content: comment.content,
                created_at: comment.created_at,
                updated_at: comment.updated_at,
                article_id: comment.article_id.toString(),
                user_id: comment.user_id.toString(),
                parent_id: comment.parent_id?.toString() ?? null,
                parent_displayName: parentDisplayName,
                user: {
                    ...comment.user,
                    id: comment.user.id.toString()
                }
            }
        }

        const responseData = rootComments.map(comment => ({
            ...serializeComment(comment),
            replies: (repliesByRootId.get(comment.id.toString()) || []).map(serializeComment)
        }))

        res.status(200).json({
            data: responseData,
            page,
            pageSize,
            total: totalRootComments
        })
    } catch (error) {
        routeLogger.error('查询文章评论失败', error instanceof Error ? error.stack : String(error));
        res.status(500).json({ error: '服务器内部错误' })
    }
})
export default router