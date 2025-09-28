import { Router, Request, Response } from "express";
import { Prisma, PrismaClient } from '@prisma/client';
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router()
const prisma = new PrismaClient()

// 获取（未删除）用户数：用户总数、已激活用户数、未激活用户数
router.get('/user', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    let totalCount, activeCount, negativeCount
    try {
        totalCount = await prisma.users.count({
            where: {
                deleted_at: null
            }
        })
        activeCount = await prisma.users.count({
            where: {
                status: 1,
                deleted_at: null
            }
        })
        negativeCount = totalCount - activeCount
    } catch (error) {
        console.log('获取用户数失败', error);
        res.status(500).json({ message: '获取用户数失败', error })
    }
    res.status(200).json({ message: '获取用户数成功', totalCount, activeCount, negativeCount })
})

// 获取（未删除）文章数目
router.get('/article', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    let totalCount, activeCount, negativeCount
    try {
        totalCount = await prisma.articles.count({
            where: {
                deleted_at: null
            }
        })
        activeCount = await prisma.articles.count({
            where: {
                status: 1,
                deleted_at: null
            }
        })
        negativeCount = totalCount - activeCount
    } catch (error) {
        console.log('获取文章数失败', error);
        res.status(500).json({ message: '获取文章数失败', error })
    }
    res.status(200).json({ message: '获取文章数成功', totalCount, activeCount, negativeCount })
})

// 获取（未删除）评论数目 -> 其中activeCount未一级评论数 | negativeCount为子评论
router.get('/comment', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    let totalCount, activeCount, negativeCount
    try {
        totalCount = await prisma.comments.count({
            where: {
                deleted_at: null
            }
        })
        activeCount = await prisma.comments.count({
            where: {
                parent: null,
                deleted_at: null
            }
        })
        negativeCount = totalCount - activeCount
    } catch (error) {
        console.log('获取评论数失败', error);
        res.status(500).json({ message: '获取评论数失败', error })
    }
    res.status(200).json({ message: '获取评论数成功', totalCount, activeCount, negativeCount })
})

/**
 * 获取网站信息
 * 敏感（需 adminMiddleware 鉴权）
 * 非敏感（直接返回信息）
 */
// 非敏感
router.get('/publicConfig', async (req: Request, res: Response) => {
    try {
        // 定义返回的公共内容的key
        const publicKeys = [
            'site_avatar',
            'site_background',
            'site_brief',
            'site_description',
            'site_header_background',
            'site_keywords',
            'site_logo',
            'sitename',
            'verify_hcaptcha_app',
            'user_captcha',
            'user_status'
        ];
        const configs = await prisma.config.findMany({
            where: {
                // 进行条件筛选 ⭐⭐⭐
                k: {
                    in: publicKeys
                }
            },
            select: {
                k: true,
                v: true
            }
        })
        // 将数组转换为对象进行返回 ⭐⭐⭐⭐⭐
        const resultObj = configs.reduce((acc, currentItem) => {
            acc[currentItem.k] = currentItem.v
            return acc;
        }, {} as Record<string, string>)
        return res.status(200).json(resultObj)
    } catch (error) {
        console.log('获取网站配置失败：', error);
        return null
    }
})
// 敏感
router.get('/config', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const configs = await prisma.config.findMany({
            select: {
                k: true,
                v: true
            }
        })
        const resultObj = configs.reduce((acc, currentItem) => {
            acc[currentItem.k] = currentItem.v
            return acc;
        }, {} as Record<string, string>)
        return res.status(200).json(resultObj)
    } catch (error) {
        console.log('获取网站配置失败：', error);
        return null
    }
})
// 修改配置信息（需要 adminMiddleware 鉴权）
router.patch('/config', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const rawKeyArray = await prisma.config.findMany({
            select: {
                k: true
            }
        })
        // 拿到所有key值
        const keyArray = rawKeyArray.map(item => item.k)

        const data = req.body
        const keys = new Set(Object.keys(data))
        // 取出符合更新的 k
        const updateKeys = keyArray.filter(k => keys.has(k))
        
        // 更新数据库里对应 k 的数据
        const operations = updateKeys.map(key => {
            return prisma.config.update({
                where: { k: key },
                data: { v: data[key] },
            });
        });
        await prisma.$transaction(operations);
        console.log(updateKeys);
        
        return res.status(200).json({message: '更新成功', updateKeys })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: '更新失败', error})
    }
})

// 获取文章所有评论
// 获取文章评论
router.get('/allComment', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { page: pageStr, pageSize: pageSizeStr, ...filters } = req.query

        const page = parseInt(pageStr as string) || 1
        const pageSize = parseInt(pageSizeStr as string) || 5
        const skip = (page - 1) * pageSize

        const filterMappings: Record<string, { field: keyof Prisma.commentsWhereInput; type: 'exact' | 'fuzzy' | 'boolean' }> = {
            commentId: { field: 'id', type: 'exact' },
            articleId: { field: 'article_id', type: 'exact' },
            userId: { field: 'user_id', type: 'exact' },
            parentId: { field: 'parent_id', type: 'exact' },
            content: { field: 'content', type: 'fuzzy' },
        };

        // 构建查询条件
        const where: Prisma.commentsWhereInput = {
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
        const allComments = await prisma.comments.findMany({
            where: where,
            orderBy: { created_at: 'asc' }, //顺序排列
            skip,
            take: pageSize,
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
        })
        const totalComments = await prisma.comments.count({
            where: { deleted_at: null }
        })
        // 构建响应数据
        const responseData = allComments.map(comment => {
            const parentDisplayName = comment.parent?.user.nickname ?? comment.parent?.user.username ?? null
            return {
                id: comment.id.toString(),
                content: comment.content,
                created_at: comment.created_at,
                updated_at: comment.updated_at,
                article_id: comment.article_id.toString(),
                user_id: comment.user_id.toString(),
                parent_id: comment.parent_id?.toString(),
                parent_displayName: parentDisplayName,
                user: {
                    ...comment.user,
                    id: comment.user.id.toString()
                }
            }
        })
        res.status(200).json({
            data: responseData,
            page,
            pageSize,
            total: totalComments
        })
    } catch (error) {
        console.error('查询文章评论失败', error);
        res.status(500).json({ error: error })
    }
})

// 更新评论内容
router.patch('/comment/:commentId', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const commentId = parseInt(req.params.commentId)
        const { content } = req.body
        
        if (isNaN(commentId)) {
            return res.status(400).json({ message: '无效的评论ID' })
        }
        
        if (!content || content.trim() === '') {
            return res.status(400).json({ message: '评论内容不能为空' })
        }
        
        // 检查评论是否存在
        const existingComment = await prisma.comments.findUnique({
            where: { id: commentId, deleted_at: null }
        })
        
        if (!existingComment) {
            return res.status(404).json({ message: '评论不存在' })
        }
        
        // 更新评论内容
        const updatedComment = await prisma.comments.update({
            where: { id: commentId },
            data: { 
                content: content.trim(),
                updated_at: new Date()
            },
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
        })
        
        // 构建响应数据
        const parentDisplayName = updatedComment.parent?.user.nickname ?? updatedComment.parent?.user.username ?? null
        const responseData = {
            id: updatedComment.id.toString(),
            content: updatedComment.content,
            created_at: updatedComment.created_at.toISOString(),
            updated_at: updatedComment.updated_at.toISOString(),
            article_id: updatedComment.article_id.toString(),
            user_id: updatedComment.user_id.toString(),
            parent_id: updatedComment.parent_id?.toString(),
            parent_displayName: parentDisplayName,
            user: {
                ...updatedComment.user,
                id: updatedComment.user.id.toString()
            }
        }
        
        res.status(200).json({ 
            message: '评论更新成功', 
            data: responseData
        })
    } catch (error) {
        console.error('更新评论失败', error);
        res.status(500).json({ message: '更新评论失败', error })
    }
})

// 获取所有用户
router.get('/allUsers', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { page: pageStr, pageSize: pageSizeStr, ...filters } = req.query

        const page = parseInt(pageStr as string) || 1
        const pageSize = parseInt(pageSizeStr as string) || 5
        const skip = (page - 1) * pageSize

        const filterMappings: Record<string, { field: keyof Prisma.usersWhereInput; type: 'exact' | 'fuzzy' | 'boolean' }> = {
            userId: { field: 'id', type: 'exact' },
            username: { field: 'username', type: 'fuzzy' },
            email: { field: 'email', type: 'fuzzy' },
            nickname: { field: 'nickname', type: 'fuzzy' },
            status: { field: 'status', type: 'exact' },
            role: { field: 'role', type: 'exact' },
        };

        // 构建查询条件
        const where: Prisma.usersWhereInput = {
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
        const allUsers = await prisma.users.findMany({
            where: where,
            orderBy: { created_at: 'desc' }, // 倒序排列，最新用户在前
            skip,
            take: pageSize,
            select: {
                id: true,
                username: true,
                email: true,
                nickname: true,
                brief: true,
                role: true,
                status: true,
                header_background: true,
                avatar: true,
                created_at: true,
                updated_at: true
            }
        })
        const totalUsers = await prisma.users.count({
            where: { deleted_at: null }
        })
        
        // 构建响应数据
        const responseData = allUsers.map(user => ({
            ...user,
            id: user.id.toString(),
            created_at: user.created_at.toISOString(),
            updated_at: user.updated_at.toISOString()
        }))
        
        res.status(200).json({
            data: responseData,
            page,
            pageSize,
            total: totalUsers
        })
    } catch (error) {
        console.error('查询用户失败', error);
        res.status(500).json({ error: error })
    }
})

// 删除用户（软删除）
router.delete('/user/:userId', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.userId)
        
        if (isNaN(userId)) {
            return res.status(400).json({ message: '无效的用户ID' })
        }
        
        // 检查用户是否存在
        const user = await prisma.users.findUnique({
            where: { id: userId, deleted_at: null }
        })
        
        if (!user) {
            return res.status(404).json({ message: '用户不存在' })
        }
        
        // 软删除用户
        await prisma.users.update({
            where: { id: userId },
            data: { deleted_at: new Date() }
        })
        
        res.status(200).json({ message: '用户删除成功' })
    } catch (error) {
        console.error('删除用户失败', error);
        res.status(500).json({ message: '删除用户失败', error })
    }
})

// 更新用户信息
router.patch('/user/:userId', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.userId)
        const { username, email, nickname, brief, status, role, avatar, header_background } = req.body
        
        if (isNaN(userId)) {
            return res.status(400).json({ message: '无效的用户ID' })
        }
        
        // 检查用户是否存在
        const existingUser = await prisma.users.findUnique({
            where: { id: userId, deleted_at: null }
        })
        
        if (!existingUser) {
            return res.status(404).json({ message: '用户不存在' })
        }
        
        // 构建更新数据
        const updateData: any = {}
        if (username !== undefined) updateData.username = username
        if (email !== undefined) updateData.email = email
        if (nickname !== undefined) updateData.nickname = nickname
        if (brief !== undefined) updateData.brief = brief
        if (status !== undefined) updateData.status = parseInt(status)
        if (role !== undefined) updateData.role = parseInt(role)
        if (avatar !== undefined) updateData.avatar = avatar
        if (header_background !== undefined) updateData.header_background = header_background
        
        // 更新用户信息
        const updatedUser = await prisma.users.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                username: true,
                email: true,
                nickname: true,
                brief: true,
                role: true,
                status: true,
                avatar: true,
                header_background: true,
                created_at: true,
                updated_at: true
            }
        })
        
        res.status(200).json({ 
            message: '用户信息更新成功', 
            data: {
                ...updatedUser,
                id: updatedUser.id.toString(),
                created_at: updatedUser.created_at.toISOString(),
                updated_at: updatedUser.updated_at.toISOString()
            }
        })
    } catch (error) {
        console.error('更新用户信息失败', error);
        res.status(500).json({ message: '更新用户信息失败', error })
    }
})



export default router