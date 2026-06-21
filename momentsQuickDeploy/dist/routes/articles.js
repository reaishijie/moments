import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { optionalAuthMiddleware } from '../middleware/optionalAuthMiddleware.js';
import { logAction, logger } from "../services/log.service.js";
const router = Router();
const prisma = new PrismaClient();
// 创建一篇文章
router.post('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { content, status, location, type, isTop, isAd, adTitle, adUrl, imageUrls, videoUrls, thumbnail_url } = req.body;
        if (!content && !imageUrls && !videoUrls) {
            return res.status(400).json({ error: '文章内容不能为空' });
        }
        //创建一篇文章 ⭐⭐⭐⭐
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
                    ad_title: adTitle,
                    ad_url: adUrl,
                    user: {
                        connect: { id: BigInt(userId), }
                    }
                }
            });
            // 操作视频（填写外链）
            if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
                const imageData = imageUrls.map((url, index) => ({
                    article_id: createdArticle.id,
                    image_url: url,
                    sort_order: index
                }));
                await tx.article_images.createMany({ data: imageData });
            }
            // 操作视频
            if (videoUrls && Array.isArray(videoUrls) && videoUrls.length > 0) {
                const videoData = videoUrls.map((url, index) => ({
                    article_id: createdArticle.id,
                    video_url: url,
                    thumbnail_url,
                    sort_order: index
                }));
                await tx.article_videos.createMany({ data: videoData });
            }
            return createdArticle;
        });
        logger.add({
            userId: BigInt(userId),
            action: logAction.ARTICLE_CREATE,
            targetType: 'articles',
            targetId: BigInt(newArticle.id),
            details: newArticle,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || '',
        });
        res.status(201).json({
            ...newArticle,
            id: newArticle.id.toString(), //将 BigInt 类型转换
            user_id: newArticle.user_id.toString()
        });
    }
    catch (error) {
        console.error('创建文章失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});
// 获取文章列表 ⭐⭐⭐⭐
router.get('/', optionalAuthMiddleware, async (req, res) => {
    try {
        const { page: pageStr, pageSize: pageSizeStr, ...filters } = req.query;
        const page = parseInt(pageStr) || 1;
        const pageSize = parseInt(pageSizeStr) || 5;
        const skip = (page - 1) * pageSize;
        const filterMappings = {
            articleId: { field: 'id', type: 'exact' },
            userId: { field: 'user_id', type: 'exact' },
            content: { field: 'content', type: 'fuzzy' },
            location: { field: 'location', type: 'fuzzy' },
            type: { field: 'type', type: 'exact' },
            isTop: { field: 'is_top', type: 'boolean' },
            isAd: { field: 'is_ad', type: 'boolean' },
        };
        // 构建查询条件
        const where = {
            status: 1, //1为已发布
            deleted_at: null, // 未软删除的
        };
        for (const key in filters) {
            if (filterMappings[key]) {
                const { field, type } = filterMappings[key];
                const value = filters[key];
                if (type === 'exact') {
                    where[field] = parseInt(value);
                }
                else if (type === 'fuzzy') {
                    where[field] = {
                        contains: value,
                        // MySQL大小写不敏感无需添加，否则需要设置字段 utf8mb4_unicode_ci
                        // mode: 'insensitive',
                    };
                }
                else if (type === 'boolean') {
                    where[field] = (value === 'true');
                }
            }
        }
        const articles = await prisma.articles.findMany({
            where: where,
            skip: skip,
            take: pageSize,
            orderBy: [
                { is_top: 'desc' },
                { created_at: 'desc' }, //按时间发布降序排列
                { id: 'desc' }
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
        });
        // 动态计算用户对文章的喜欢状态
        let articleWithLikeStatus = articles;
        if (req.user) {
            // 返回文章id为一个数组
            const articleIds = articles.map(a => a.id);
            const userLikes = await prisma.article_likes.findMany({
                where: {
                    user_id: BigInt(req.user.userId),
                    article_id: { in: articleIds }
                },
                select: { article_id: true }
            });
            // 将用户点赞的文章储存到一个 Set 里（Set.has()判断比数组块）
            const likeArticleIds = new Set(userLikes.map(like => like.article_id));
            articleWithLikeStatus = articles.map(article => ({
                ...article,
                // 喜欢的文章id列表里有没有当前文章id 有为true | 无为false
                isLiked: likeArticleIds.has(article.id)
            }));
        }
        else {
            // 游客
            const guestId = req.headers['x-guest-id'];
            const articleIds = articles.map(a => a.id);
            if (guestId && articleIds.length > 0) {
                const guestLikes = await prisma.article_guest_likes.findMany({
                    where: { guest_id: guestId, article_id: { in: articleIds } },
                    select: { article_id: true }
                });
                const likeArticleIds = new Set(guestLikes.map(like => like.article_id));
                articleWithLikeStatus = articles.map(article => ({
                    ...article,
                    isLiked: likeArticleIds.has(article.id)
                }));
            }
        }
        // 总文章数
        const totalArticles = await prisma.articles.count({
            where: where
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
            article_images: article.article_images.map((image) => ({
                ...image,
                id: image.id.toString(),
                article_id: image.article_id?.toString()
            })),
            article_videos: article.article_videos.map((video) => ({
                ...video,
                id: video.id.toString(),
                article_id: video.article_id?.toString()
            })),
        }));
        res.status(200).json({
            data: responseArticles,
            total: totalArticles,
            page,
            pageSize
        });
    }
    catch (error) {
        console.error('获取文章列表失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});
// 查询单篇文章详情
router.get('/:articleId', optionalAuthMiddleware, async (req, res) => {
    try {
        const { articleId } = req.params;
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
        });
        if (!article) {
            return res.status(404).json({ error: '文章未找到或未发布' });
        }
        let isLiked = false;
        // 如果为登录用户
        if (req.user) {
            const userLike = await prisma.article_likes.findFirst({
                where: {
                    user_id: BigInt(req.user.userId),
                    article_id: article.id
                },
                select: { article_id: true }
            });
            // 检查是否找到了点赞记录
            isLiked = !!userLike;
        }
        // 游客
        else {
            const guestId = req.headers['x-guest-id'];
            if (guestId) {
                const guestLike = await prisma.article_guest_likes.findFirst({
                    where: {
                        guest_id: guestId,
                        article_id: article.id
                    },
                    select: { article_id: true }
                });
                // 检查是否找到了点赞记录
                isLiked = !!guestLike;
            }
        }
        // 构建返回数据
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
                article_id: image.article_id?.toString()
            })),
            article_videos: article.article_videos.map(video => ({
                ...video,
                id: video.id.toString(),
                article_id: video.article_id?.toString()
            })),
            isLiked
        };
        res.status(200).json(responseData);
    }
    catch (error) {
        console.error('获取单篇文章失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});
// 更新一篇自己的文章（需要身份认证或管理员 role = 1）
router.patch('/:articleId', authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ status: false, message: '请重新登录' });
        }
        if (req.body === undefined) {
            return res.status(400).json({ status: false, message: '请求数据格式错误' });
        }
        const userId = req.user?.userId;
        const { articleId } = req.params;
        const { content, status, location, type, isAd, isTop, imageUrls, videoUrls } = req.body;
        // 验证文章是否存在
        const article = await prisma.articles.findUnique({
            where: {
                id: BigInt(articleId)
            }
        });
        if (!article) {
            return res.status(404).json({ error: '文章未找到' });
        }
        // 验证文章所属权
        if (article.user_id.toString() !== userId && req.user.role !== 1) {
            logger.add({
                userId: BigInt(userId),
                action: logAction.ARTICLE_UPDATE,
                targetType: 'articles',
                targetId: BigInt(articleId),
                status: 'FAILED',
                details: { error: '无权修改此文章' },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'] || '',
            });
            return res.status(403).json({ status: false, error: '无权修改此文章' });
        }
        // 构建更新数据
        const updateData = {};
        // 数据不为空进行更新
        if (content)
            updateData.content = content;
        if (status != undefined)
            updateData.status = status;
        if (location)
            updateData.location = location;
        if (type)
            updateData.type = type;
        if (isAd)
            updateData.isAd = isAd;
        if (isTop)
            updateData.isTop = isTop;
        if (imageUrls)
            updateData.imageUrls = imageUrls;
        if (videoUrls)
            updateData.videoUrls = videoUrls;
        const updateArticle = await prisma.articles.update({
            where: {
                id: BigInt(articleId)
            },
            data: updateData
        });
        // 数据格式转换
        const responseData = {
            ...updateArticle,
            id: updateArticle.id.toString(),
            user_id: updateArticle.user_id.toString()
        };
        logger.add({
            userId: BigInt(userId),
            action: logAction.ARTICLE_UPDATE,
            targetType: 'articles',
            targetId: BigInt(articleId),
            details: responseData,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || '',
        });
        res.status(200).json({ status: true, message: '更新成功', data: responseData });
    }
    catch (error) {
        console.error('更新文章失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});
// 删除一篇自己的文章，（需要身份认证或管理员 role = 1）
router.delete('/:articleId', authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ status: false, message: '请重新登录' });
        }
        const userId = req.user.userId;
        const { articleId } = req.params;
        const article = await prisma.articles.findUnique({
            where: { id: BigInt(articleId) }
        });
        if (!article) {
            return res.status(404).json({ error: '文章未找到' });
        }
        if (article.user_id.toString() !== userId && req.user.role !== 1) {
            logger.add({
                userId: BigInt(userId),
                action: logAction.ARTICLE_DELETE,
                targetType: 'articles',
                targetId: BigInt(articleId),
                status: 'FAILED',
                details: { error: '无权删除此文章' },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'] || '',
            });
            return res.status(403).json({ status: false, error: '无权删除此文章' });
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
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('删除文章失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});
// 获取一篇文章的评论
router.get('/:articleId/comments', async (req, res) => {
    try {
        const { articleId } = req.params;
        // 分页查询
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 5;
        const skip = (page - 1) * pageSize;
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
        });
        // 获取评论总数
        const totalComments = await prisma.comments.count({
            where: {
                article_id: BigInt(articleId),
                //解开这行注释表示只统计根评论数
                // parent_id: null,
                deleted_at: null
            }
        });
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
        }));
        res.status(200).json({
            data: responseData,
            total: totalComments,
            page,
            pageSize
        });
    }
    catch (error) {
        console.error('获取文章的评论列表失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});
// 文章点赞
router.post('/:articleId/like', optionalAuthMiddleware, async (req, res) => {
    try {
        const { articleId } = req.params;
        // 检查文章是否存在
        const article = await prisma.articles.findFirst({
            where: {
                id: BigInt(articleId),
                status: 1,
                deleted_at: null
            }
        });
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
            });
            return res.status(404).json({ error: '文章不存在或未发布，点赞失败' });
        }
        // 根据登录状态执行不同的点赞逻辑
        if (req.user) {
            const userId = req.user.userId;
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
            ]);
            logger.add({
                userId: null,
                action: logAction.LIKE_CREATE,
                targetType: 'likes',
                targetId: BigInt(articleId),
                details: { message: '点赞成功' },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'] || '',
            });
            return res.status(200).json({ message: '点赞成功' });
        }
        else {
            // 游客操作逻辑
            const guestId = req.headers['x-guest-id'];
            const ipAddress = req.ip;
            if (!guestId) {
                return res.status(400).json({ error: '未提供游客id' });
            }
            // 简单ip验证
            const existingIp = await prisma.article_guest_likes.findFirst({
                where: {
                    article_id: BigInt(articleId),
                    ip_address: ipAddress
                }
            });
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
                });
                return res.status(429).json({ error: '操作过于频繁，请稍后再试' });
            }
            // 进行点赞操作处理
            await prisma.$transaction([
                // 创建游客喜欢表的记录
                prisma.article_guest_likes.create({
                    data: {
                        guest_id: guestId,
                        article_id: BigInt(articleId),
                        ip_address: ipAddress
                    }
                }),
                // 更新文章点赞数
                prisma.articles.update({
                    where: { id: BigInt(articleId) },
                    data: { like_count: { increment: 1 } }
                })
            ]);
            logger.add({
                userId: null,
                action: logAction.LIKE_CREATE,
                targetType: 'likes',
                targetId: BigInt(articleId),
                details: { message: '点赞成功' },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'] || '',
            });
            res.status(200).json({ message: '游客点赞成功' });
        }
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: '已经点过赞了' });
        }
        console.error('点赞失败', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});
// 取消文章喜欢
router.delete('/:articleId/like', optionalAuthMiddleware, async (req, res) => {
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
            });
            return res.status(200).json({ message: '取消点赞成功' });
        }
        else {
            // 游客的逻辑
            const guestId = req.headers['x-guest-id'];
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
            logger.add({
                userId: null,
                action: logAction.LIKE_DELETE,
                targetType: 'likes',
                targetId: BigInt(articleId),
                details: { message: '游客取消点赞成功' },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'] || '',
            });
            return res.status(200).json({ message: '游客取消点赞成功' });
        }
    }
    catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: '您尚未点赞，无法取消' });
        }
        console.error('取消点赞失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});
// 获取文章的点赞用户信息
router.get('/:articleId/like', optionalAuthMiddleware, async (req, res) => {
    try {
        const { articleId } = req.params;
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
        });
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
        }));
        res.status(200).json(responseData);
    }
    catch (error) {
        console.error('获取文章的点赞用户信息失败：', error);
        res.status(500).json({ error: '获取文章的点赞用户信息失败' });
    }
});
export default router;
