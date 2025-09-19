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
    } catch(error) {
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
    } catch(error) {
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
    } catch(error) {
        console.log('获取评论数失败', error);
        res.status(500).json({ message: '获取评论数失败', error })
    }
    res.status(200).json({ message: '获取评论数成功', totalCount, activeCount, negativeCount })
})
export default router