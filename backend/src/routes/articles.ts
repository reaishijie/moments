import { Router, Request, Response } from 'express';
import { PrismaClient, article_images, article_videos } from '@prisma/client';
import { authMiddleware } from '../middleware/authMiddleware';
import { optionalAuthMiddleware } from '../middleware/optionalAuthMiddleware';
import { logAction, logger } from "../services/log.service"

const router = Router();
const prisma = new PrismaClient();

// 创建一篇文章
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { content, status, location, type, isTop, isAd, imageUrls, videoUrls } = req.body;
        if (!content) {
            return res.status(400).json({ error: '文章内容不能为空' });
        }
        //创建一篇文章
        const newArticle = await prisma.$transaction(async (tx) => {
            // 操作文章表
            const createdArticle = await tx.articles.create({
                data: {
                    content,
                    status,
                    location,
                    type,
                    is_top: isTop,
                    is_ad: isAd,
                    user: {
                        connect: { id: BigInt(userId!), }
                    }
                }
            })
            // 操作视频
            if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
                const imageData = imageUrls.map((url: string, index: number) => ({
                    article_id: createdArticle.id,
                    image_url: url,
                    sort_order: index
                }))
                await tx.article_images.createMany({ data: imageData })
            }
            // 操作视频
            if (videoUrls && Array.isArray(videoUrls) && videoUrls.length > 0) {
                const videoData = videoUrls.map((url: string, index: number) => ({
                    article_id: createdArticle.id,
                    video_url: url,
                    sort_order: index
                }))
                await tx.article_videos.createMany({ data: videoData })
            }
            return createdArticle
        })
        logger.add({
            userId: BigInt(userId!),
            action: logAction.ARTICLE_CREATE,
            targetType: 'articles',
            targetId: BigInt(newArticle.id),
            details: newArticle,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || '',
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

// 获取文章列表
router.get('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
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
            orderBy: [
                { is_top: 'desc' },
                { published_at: 'desc' } //按时间发布降序排列
            ],
            //同时查询作者部分信息、文章的相关图片/视频
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        nickname: true,
                        avatar: true,
                        header_background: true
                    }
                },
                article_images: { orderBy: { sort_order: 'asc' } },
                article_videos: { orderBy: { sort_order: 'asc' } },
            }
        })

        // 动态计算用户对文章的喜欢状态
        let articleWithLikeStatus: any[] = articles
        if (req.user) {
            // 返回文章id为一个数组
            const articleIds = articles.map(a => a.id)
            const userLikes = await prisma.article_likes.findMany({
                where: {
                    user_id: BigInt(req.user.userId),
                    article_id: { in: articleIds }
                },
                select: { article_id: true }
            })
            // 将用户点赞的文章储存到一个 Set 里（Set.has()判断比数组块）
            const likeArticleIds = new Set(userLikes.map(like => like.article_id))
            articleWithLikeStatus = articles.map(article => ({
                ...article,
                // 喜欢的文章id列表里有没有当前文章id 有为true | 无为false
                isLiked: likeArticleIds.has(article.id)
            }))
        } else {
            // 游客
            const guestId = req.headers['x-guest-id'] as string
            const articleIds = articles.map(a => a.id)
            if(guestId && articleIds.length > 0) {
                const guestLikes = await prisma.article_guest_likes.findMany({
                    where: { guest_id: guestId, article_id: { in: articleIds}},
                    select: { article_id: true}
                })

                const likeArticleIds = new Set(guestLikes.map( like => like.article_id))
                articleWithLikeStatus = articles.map(article => ({
                    ...article,
                    isLike: likeArticleIds.has(article.id)
                }))
            }
        }
        // 总文章数
        const totalArticles = await prisma.articles.count({
            where: { status: 1, deleted_at: null }
        });
        // 处理数据，转化BigInt
        const responseArticles = articleWithLikeStatus.map(article => ({
            ...article,
            id: article.id.toString(),
            user_id: article.user_id.toString(),
            user: {
                ...article.user,
                id: article.user.id.toString()
            },
            article_images: article.article_images.map((image: article_images) => ({
                ...image,
                id: image.id.toString(),
                article_id: image.article_id.toString()
            })),
            article_videos: article.article_videos.map((video: article_videos) => ({
                ...video,
                id: video.id.toString(),
                article_id: video.article_id.toString()
            })),
        }));
        console.log('@@@',responseArticles);
        
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
                },
                article_images: { orderBy: { sort_order: 'asc' } },
                article_videos: { orderBy: { sort_order: 'asc' } }
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
            },
            article_images: article.article_images.map(image => ({
                ...image,
                id: image.id.toString(),
                article_id: image.article_id.toString()
            })),
            article_videos: article.article_videos.map(video => ({
                ...video,
                id: video.id.toString(),
                article_id: video.article_id.toString()
            })),
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
        const { content, status, location, type, isAd, isTop, imageUrls, videoUrls } = req.body
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
            logger.add({
                userId: BigInt(userId!),
                action: logAction.ARTICLE_UPDATE,
                targetType: 'articles',
                targetId: BigInt(articleId),
                status: 'FAILED',
                details: { error: '无权修改此文章' },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'] || '',
            })
            return res.status(403).json({ error: '无权修改此文章' })
        }
        // 构建更新数据
        const updateData: { content?: string, status?: number, location?: string, type?: number, isAd?: boolean, isTop?: boolean, imageUrls?: object, videoUrls?: object } = {}
        // 数据不为空进行更新
        if (content) updateData.content = content
        if (status != undefined) updateData.status = status
        if (location) updateData.location = location
        if (type) updateData.type = type
        if (isAd) updateData.isAd = isAd
        if (isTop) updateData.isTop = isTop
        if (imageUrls) updateData.imageUrls = imageUrls
        if (videoUrls) updateData.videoUrls = videoUrls
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
        logger.add({
            userId: BigInt(userId),
            action: logAction.ARTICLE_UPDATE,
            targetType: 'articles',
            targetId: BigInt(articleId),
            details: responseData,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || '',
        })
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
            logger.add({
                userId: BigInt(userId!),
                action: logAction.ARTICLE_DELETE,
                targetType: 'articles',
                targetId: BigInt(articleId),
                status: 'FAILED',
                details: { error: '无权删除此文章' },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'] || '',
            })
            return res.status(403).json({ error: '无权删除此文章' });
        }
        // 执行软删除
        await prisma.articles.update({
            where: { id: BigInt(articleId) },
            data: {
                deleted_at: new Date()
            }
        });
        logger.add({
            userId: BigInt(userId),
            action: logAction.ARTICLE_DELETE,
            targetType: 'articles',
            targetId: BigInt(articleId),
            details: article,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || '',
        })
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
        console.error('取消点赞失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});
export default router