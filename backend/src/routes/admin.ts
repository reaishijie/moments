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
            'avatar',
            'background',
            'brief',
            'description',
            'header_background',
            'keywords',
            'logo',
            'sitename'
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
export default router