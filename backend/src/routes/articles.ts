import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/authMiddleware';

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
export default router