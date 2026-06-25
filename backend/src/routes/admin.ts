import { Router, Request, Response } from "express";
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { buildConfigWhere, formatConfigResponse, parseConfigQuery, type ConfigAccessLevel } from "../services/config-query.service.js";

const router = Router()

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
 * publicConfig：游客可见配置
 * userConfig：登录用户可见配置
 * config：管理员可见配置
 */
async function sendConfigResponse(req: Request, res: Response, allowedAccessLevels: ConfigAccessLevel[]) {
    try {
        const parsedQuery = parseConfigQuery(req.query, allowedAccessLevels)
        const configs = await prisma.config.findMany({
            where: buildConfigWhere(parsedQuery),
            select: {
                k: true,
                v: true,
                name: true,
                description: true,
                category: true,
                sort: true,
                access_level: true,
            },
            orderBy: [
                { category: 'asc' },
                { sort: 'asc' },
                { k: 'asc' },
            ],
        })
        return res.status(200).json(formatConfigResponse(configs, parsedQuery.detail))
    } catch (error) {
        console.log('获取网站配置失败：', error);
        return res.status(500).json({ message: '获取网站配置失败', error })
    }
}

// 游客可见配置
router.get('/publicConfig', async (req: Request, res: Response) => {
    return sendConfigResponse(req, res, ['public'])
})

// 登录用户可见配置
router.get('/userConfig', authMiddleware, async (req: Request, res: Response) => {
    return sendConfigResponse(req, res, ['public', 'user'])
})

// 管理员可见配置
router.get('/config', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    return sendConfigResponse(req, res, ['public', 'user', 'admin'])
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

function formatLink(link: {
    id: bigint
    logo: string | null
    sitename: string
    brief: string | null
    url: string
    status: number
    created_at: Date
    deleted_at: Date | null
}) {
    return {
        ...link,
        id: link.id.toString(),
        created_at: link.created_at.toISOString(),
        deleted_at: link.deleted_at?.toISOString() ?? null,
    }
}

// 获取全部友情链接
router.get('/links', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { page: pageStr, pageSize: pageSizeStr, ...filters } = req.query
        const page = parseInt(pageStr as string) || 1
        const pageSize = parseInt(pageSizeStr as string) || 10
        const skip = (page - 1) * pageSize

        const where: Prisma.linkWhereInput = { deleted_at: null }

        if (filters.linkId) where.id = BigInt(filters.linkId as string)
        if (filters.sitename) where.sitename = { contains: filters.sitename as string }
        if (filters.url) where.url = { contains: filters.url as string }
        if (filters.brief) where.brief = { contains: filters.brief as string }
        if (filters.status !== undefined && filters.status !== '') where.status = parseInt(filters.status as string)

        const [links, total] = await Promise.all([
            prisma.link.findMany({
                where,
                orderBy: { created_at: 'desc' },
                skip,
                take: pageSize,
            }),
            prisma.link.count({ where }),
        ])

        res.status(200).json({
            data: links.map(formatLink),
            page,
            pageSize,
            total,
        })
    } catch (error) {
        console.error('查询友情链接失败', error)
        res.status(500).json({ message: '查询友情链接失败', error })
    }
})

// 新增友情链接
router.post('/links', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { logo, sitename, brief, url, status } = req.body

        if (!sitename || !url) {
            return res.status(400).json({ message: '站点名称和链接地址不能为空' })
        }

        const link = await prisma.link.create({
            data: {
                logo: logo || null,
                sitename: String(sitename).trim(),
                brief: brief || null,
                url: String(url).trim(),
                status: status === undefined ? 1 : parseInt(status),
            },
        })

        res.status(200).json({ message: '友情链接新增成功', data: formatLink(link) })
    } catch (error) {
        console.error('新增友情链接失败', error)
        res.status(500).json({ message: '新增友情链接失败', error })
    }
})

// 更新友情链接
router.patch('/link/:linkId', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const linkId = parseInt(req.params.linkId)
        const { logo, sitename, brief, url, status } = req.body

        if (isNaN(linkId)) {
            return res.status(400).json({ message: '无效的友情链接ID' })
        }

        const existingLink = await prisma.link.findFirst({
            where: { id: linkId, deleted_at: null },
        })

        if (!existingLink) {
            return res.status(404).json({ message: '友情链接不存在' })
        }

        const updateData: Prisma.linkUpdateInput = {}
        if (logo !== undefined) updateData.logo = logo || null
        if (sitename !== undefined) updateData.sitename = String(sitename).trim()
        if (brief !== undefined) updateData.brief = brief || null
        if (url !== undefined) updateData.url = String(url).trim()
        if (status !== undefined) updateData.status = parseInt(status)

        const link = await prisma.link.update({
            where: { id: linkId },
            data: updateData,
        })

        res.status(200).json({ message: '友情链接更新成功', data: formatLink(link) })
    } catch (error) {
        console.error('更新友情链接失败', error)
        res.status(500).json({ message: '更新友情链接失败', error })
    }
})

// 删除友情链接（软删除）
router.delete('/link/:linkId', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const linkId = parseInt(req.params.linkId)

        if (isNaN(linkId)) {
            return res.status(400).json({ message: '无效的友情链接ID' })
        }

        const existingLink = await prisma.link.findFirst({
            where: { id: linkId, deleted_at: null },
        })

        if (!existingLink) {
            return res.status(404).json({ message: '友情链接不存在' })
        }

        await prisma.link.update({
            where: { id: linkId },
            data: { deleted_at: new Date() },
        })

        res.status(200).json({ message: '友情链接删除成功' })
    } catch (error) {
        console.error('删除友情链接失败', error)
        res.status(500).json({ message: '删除友情链接失败', error })
    }
})

export default router
