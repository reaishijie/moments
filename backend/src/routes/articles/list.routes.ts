import { Router, Request, Response } from 'express'
import { Logger } from '../../utils/logger.js'
import { Prisma } from '@prisma/client'
import { articleInclude, listArticleInclude, serializeArticle, serializeFeedArticle } from './shared.js'
import { optionalAuthMiddleware } from '../../middleware/optionalAuthMiddleware.js'
import { parsePagination } from '../../utils/pagination.js'
import { prisma } from '../../lib/prisma.js'
import { toBigInt } from '../../utils/parseId.js'

const routeLogger = new Logger('ArticlesListRoute')
const router = Router()

// 获取文章列表 ⭐⭐⭐⭐
router.get('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
    try {
        const { page: pageStr, pageSize: pageSizeStr, ...filters } = req.query

        // 统一收敛分页参数，避免超大 pageSize 触发全表扫描
        const { page, pageSize, skip } = parsePagination({ page: pageStr, pageSize: pageSizeStr })

        const filterMappings: Record<string, { field: keyof Prisma.articlesWhereInput; type: 'exact' | 'fuzzy' | 'boolean' }> = {
            articleId: { field: 'id', type: 'exact' },
            userId: { field: 'user_id', type: 'exact' },
            content: { field: 'content', type: 'fuzzy' },
            location: { field: 'location', type: 'fuzzy' },
            type: { field: 'type', type: 'exact' },
            isTop: { field: 'is_top', type: 'boolean' },
            isAd: { field: 'is_ad', type: 'boolean' },
        };

        // 构建查询条件
        const where: Prisma.articlesWhereInput = {
            status: 1, //1为已发布
            deleted_at: null, // 未软删除的
        };
        for (const key in filters) {
            if (filterMappings[key]) {
                const { field, type } = filterMappings[key];
                const value = filters[key];

                if (type === 'exact') {
                    (where as any)[field] = parseInt(value as string);
                } else if (type === 'fuzzy') {
                    (where as any)[field] = {
                        contains: value as string,
                        // MySQL大小写不敏感无需添加，否则需要设置字段 utf8mb4_unicode_ci
                        // mode: 'insensitive',
                    };
                } else if (type === 'boolean') {
                    (where as any)[field] = (value === 'true');
                }
            }
        }
        const tagFilter = typeof filters.tag === 'string' ? filters.tag.trim() : '';
        if (tagFilter) {
            where.tags = {
                some: {
                    tag: {
                        name: tagFilter
                    }
                }
            };
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
            //列表场景一次性带出作者、图片/视频/标签、点赞人预览、前 N 条评论与评论总数
            include: listArticleInclude
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
            if (guestId && articleIds.length > 0) {
                const guestLikes = await prisma.article_guest_likes.findMany({
                    where: { guest_id: guestId, article_id: { in: articleIds } },
                    select: { article_id: true }
                })

                const likeArticleIds = new Set(guestLikes.map(like => like.article_id))
                articleWithLikeStatus = articles.map(article => ({
                    ...article,
                    isLiked: likeArticleIds.has(article.id)
                }))
            }
        }
        const displayedRootComments = articleWithLikeStatus.flatMap(article => article.comments ?? []);
        const displayedRootIds = displayedRootComments.map(comment => comment.id);
        if (displayedRootIds.length > 0) {
            const rootIdSet = new Set(displayedRootIds.map(id => id.toString()));
            const allReplies = await prisma.comments.findMany({
                where: {
                    article_id: { in: articleWithLikeStatus.map(article => article.id) },
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
            });
            const replyMap = new Map(allReplies.map(reply => [reply.id.toString(), reply]));
            const repliesByRootId = new Map<string, typeof allReplies>();

            const findRootId = (reply: typeof allReplies[number]) => {
                let parentId = reply.parent_id?.toString() ?? null;
                const visited = new Set<string>();
                while (parentId) {
                    if (rootIdSet.has(parentId)) return parentId;
                    if (visited.has(parentId)) return null;
                    visited.add(parentId);
                    parentId = replyMap.get(parentId)?.parent_id?.toString() ?? null;
                }
                return null;
            };

            for (const reply of allReplies) {
                const rootId = findRootId(reply);
                if (!rootId) continue;
                const replies = repliesByRootId.get(rootId) || [];
                replies.push(reply);
                repliesByRootId.set(rootId, replies);
            }

            for (const comment of displayedRootComments) {
                comment.replies = repliesByRootId.get(comment.id.toString()) || [];
            }
        }

        // 总文章数
        const totalArticles = await prisma.articles.count({
            where: where
        });
        // 处理数据，转化BigInt，并附加点赞人/评论聚合数据
        const responseArticles = articleWithLikeStatus.map(serializeFeedArticle);

        res.status(200).json({
            data: responseArticles,
            total: totalArticles,
            page,
            pageSize
        });
    } catch (error) {
        routeLogger.error('获取文章列表失败:', error instanceof Error ? error.stack : String(error));
        res.status(500).json({ error: '服务器内部错误' });
    }
})

// 查询单篇文章详情
router.get('/:articleId', optionalAuthMiddleware, async (req: Request, res: Response) => {
    try {
        const articleId = toBigInt(req.params.articleId)
        if (articleId === null) {
            return res.status(400).json({ error: '文章ID不合法' })
        }
        const article = await prisma.articles.findFirst({
            where: {
                id: BigInt(articleId),
                status: 1, //已发布
                deleted_at: null //未删除
            },
            include: articleInclude
        })
        if (!article) {
            return res.status(404).json({ error: '文章未找到或未发布' });
        }
        let isLiked = false
        // 如果为登录用户
        if (req.user) {
            const userLike = await prisma.article_likes.findFirst({
                where: {
                    user_id: BigInt(req.user.userId),
                    article_id: article.id
                },
                select: { article_id: true }
            })
            // 检查是否找到了点赞记录
            isLiked = !!userLike
        }
        // 游客
        else {
            const guestId = req.headers['x-guest-id'] as string
            if (guestId) {
                const guestLike = await prisma.article_guest_likes.findFirst({
                    where: {
                        guest_id: guestId,
                        article_id: article.id
                    },
                    select: { article_id: true }
                })
                // 检查是否找到了点赞记录
                isLiked = !!guestLike
            }
        }
        // 构建返回数据
        const responseData = serializeArticle({ ...article, isLiked })
        res.status(200).json(responseData)
    } catch (error) {
        routeLogger.error('获取单篇文章失败:', error instanceof Error ? error.stack : String(error));
        res.status(500).json({ error: '服务器内部错误' });
    }
})

// 获取一篇文章的评论
router.get('/:articleId/comments', async (req: Request, res: Response) => {
    try {
        const articleId = toBigInt(req.params.articleId)
        if (articleId === null) {
            return res.status(400).json({ error: '文章ID不合法' })
        }
        // 分页查询
        const { page, pageSize, skip } = parsePagination(req.query)

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
        routeLogger.error('获取文章的评论列表失败:', error instanceof Error ? error.stack : String(error));
        res.status(500).json({ error: '服务器内部错误' });
    }
})

export default router
