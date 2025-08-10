import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/authMiddleware';
import { optionalAuthMiddleware } from '../middleware/optionalAuthMiddleware';
import { error } from 'console';

const router = Router();
const prisma = new PrismaClient();

// 创建一篇文章
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { content, status, location } = req.body;
        if (!content) {
            return res.status(400).json({ error: '内容不能为空' });
        }
        const newArticle = await prisma.articles.create({
            data: {
                content,
                status,
                location,
                user: {
                    connect: {
                        id: BigInt(userId!),
                    }
                }
            }
        })
        res.status(201).json({
            ...newArticle,
            id: newArticle.id.toString(), //将 BigInt 类型转换
            user_id: newArticle.user_id.toString()
        });

    } catch (error) {
        console.error('创建文章失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
})

// 获取文章
router.get('/', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1
        const pageSize = parseInt(req.query.pageSize as string) || 5
        const skip = (page - 1) * pageSize

        // 查询已发布、未删除文章
        const articles = await prisma.articles.findMany({
            where: {
                status: 1, //1为已发布
                deleted_at: null, //软删除的
            },
            skip: skip,
            take: pageSize,
            orderBy: {
                published_at: 'desc' //按时间发布降序排列
            },
            //同时查询作者部分信息
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        nickname: true,
                        avatar: true,
                        header_background: true
                    }
                }
            }
        })
        // 总文章数
        const totalArticles = await prisma.articles.count({
            where: { status: 1, deleted_at: null }
        });
        // 处理数据，转化BigInt
        const responseArticles = articles.map(article => ({
            ...article,
            id: article.id.toString(),
            user_id: article.user_id.toString(),
            user: {
                ...article.user,
                id: article.user.id.toString()
            }
        }));

        res.status(200).json({
            data: responseArticles,
            total: totalArticles,
            page,
            pageSize
        });
    } catch (error) {
        console.error('获取文章列表失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
})

// 查询单篇文章详情
router.get('/:articleId', async (req: Request, res: Response) => {
    try {
        const { articleId } = req.params
        const article = await prisma.articles.findFirst({
            where: {
                id: BigInt(articleId),
                status: 1, //已发布
                deleted_at: null //未删除
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        nickname: true,
                        avatar: true,
                        header_background: true
                    }
                }
            }
        })
        if (!article) {
            return res.status(404).json({ error: '文章未找到或未发布' });
        }
        const responseData = {
            ...article,
            id: article.id.toString(),
            user_id: article.user_id.toString(),
            user: {
                ...article.user,
                id: article.user.id.toString()
            }

        }
        res.status(200).json(responseData)
    } catch (error) {
        console.error('获取单篇文章失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
})

// 更新一篇自己的文章（需要身份认证）
router.patch('/:articleId', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId
        const { articleId } = req.params
        const { content, status, location } = req.body
        // 验证文章是否存在
        const article = await prisma.articles.findUnique({
            where: {
                id: BigInt(articleId)
            }
        })
        if (!article) {
            return res.status(404).json({ error: '文章未找到' })
        }
        // 验证文章所属权
        if (article.user_id.toString() !== userId) {
            return res.status(403).json({ error: '无权修改此文章' })
        }
        // 构建更新数据
        const updateData: { content?: string, status?: number, location?: string } = {}
        if (content) updateData.content = content
        if (status != undefined) updateData.status = status
        if (location) updateData.location = location
        const updateArticle = await prisma.articles.update({
            where: {
                id: BigInt(articleId)
            },
            data: updateData
        })
        // 数据格式转换
        const responseData = {
            ...updateArticle,
            id: updateArticle.id.toString(),
            user_id: updateArticle.user_id.toString()
        }
        res.status(200).json(responseData)
    } catch (error) {
        console.error('更新文章失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
})

// 删除一篇自己的文章，需身份认证
router.delete('/:articleId', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { articleId } = req.params;

        const article = await prisma.articles.findUnique({
            where: { id: BigInt(articleId) }
        });

        if (!article) {
            return res.status(404).json({ error: '文章未找到' });
        }

        if (article.user_id.toString() !== userId) {
            return res.status(403).json({ error: '无权删除此文章' });
        }
        // 执行软删除
        await prisma.articles.update({
            where: { id: BigInt(articleId) },
            data: {
                deleted_at: new Date()
            }
        });

        res.status(204).send();
    } catch (error) {
        console.error('删除文章失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
})

// 获取一篇文章的评论
router.get('/:articleId/comments', async (req: Request, res: Response) => {
    try {
        const { articleId } = req.params
        // 分页查询
        const page = parseInt(req.query.page as string) || 1
        const pageSize = parseInt(req.query.pageSize as string) || 5
        const skip = (page - 1) * pageSize

        // 查询文章的一级评论
        const comments = await prisma.comments.findMany({
            where: {
                article_id: BigInt(articleId),
                parent_id: null,
                deleted_at: null
            },
            skip: skip,
            take: pageSize,
            orderBy: {
                created_at: 'asc'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        nickname: true,
                        avatar: true
                    }
                },
                // 自关联查询，这条评论的所有回复
                replies: {
                    where: {
                        deleted_at: null
                    },
                    orderBy: { created_at: 'asc' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                nickname: true,
                                avatar: true
                            }
                        }
                    }
                }
            }
        })

        // 获取评论总数
        const totalComments = await prisma.comments.count({
            where: {
                article_id: BigInt(articleId),
                //解开这行注释表示只统计根评论数
                // parent_id: null,
                deleted_at: null
            }
        })
        // 构造数据
        const responseData = comments.map(comment => ({
            ...comment,
            id: comment.id.toString(),
            article_id: comment.article_id.toString(),
            user_id: comment.user_id.toString(),
            user: {
                ...comment.user,
                id: comment.user.id.toString()
            },
            replies: comment.replies.map(reply => ({
                ...reply,
                id: reply.id.toString(),
                article_id: reply.article_id.toString(),
                user_id: reply.user_id.toString(),
                parent_id: reply.parent_id?.toString(),
                user: {
                    ...reply.user,
                    id: reply.user.id.toString()
                }
            }))
        }
        ))
        res.status(200).json({
            data: responseData,
            total: totalComments,
            page,
            pageSize
        })
    } catch (error) {
        console.error('获取文章的评论列表失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
})

// 文章点赞
router.post('/:articleId/like', optionalAuthMiddleware, async (req: Request, res: Response) => {
    try {
        const { articleId } = req.params

        // 检查文章是否存在
        const article = await prisma.articles.findFirst({
            where: {
                id: BigInt(articleId),
                status: 1,
                deleted_at: null
            }
        })
        if (!article) {
            return res.status(404).json({ error: '文章不存在或未发布' })
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
            res.status(200).json({ message: '游客点赞成功' })
        }

    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: '已经点过赞了' })
        }
        console.error('点赞失败', error)
        res.status(500).json({ error: '服务器内部错误' })
    }
})

// 取消文章喜欢
router.delete('/:articleId/like', optionalAuthMiddleware, async (req: Request, res: Response) => {
    try {
        const { articleId } = req.params;

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
            ]);
            return res.status(200).json({ message: '游客取消点赞成功' });
        }
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: '您尚未点赞，无法取消' });
        }
        console.error('取消点赞失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});
export default router