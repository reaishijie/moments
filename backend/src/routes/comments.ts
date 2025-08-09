import { Router ,Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/authMiddleware";
import { error } from "console";
import { connect } from "http2";

const router = Router()
const prisma = new PrismaClient()

// 创建一条评论 需要登录
router.post('/', authMiddleware, async(req: Request, res: Response) => {
    try {
        const userId = req.user?.userId
        const {articleId, content, parentId } = req.body

        // 验证输入
        if(!articleId || !content) {
            return res.status(400).json({error: '文章ID和评论内容不能为空'})
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
        if(!article) {
            return res.status(404).json({error: '文章不存在或未发布'})
        }
        // 使用 prisma 事务来保证数据一致性（都成功/失败）
        const [newComment, updateArticle] = await prisma.$transaction([
            // 创建新评论
            prisma.comments.create({
                data: {
                    content,
                    article: { connect : { id: BigInt(articleId) } },
                    user: { connect: { id: BigInt(userId!) } },
                    ...(parentId && { parent: { connect: {id: BigInt(parentId)}}})
                }
            }),
            // 更新文章评论计数
            prisma.articles.update({
                where: { id: BigInt(articleId)},
                data: {
                    comment_count: {
                        increment: 1, //原子性地加一
                    }
                }
            })
        ])
        // 构建返回数据
        const responseData = {
            ...newComment,
            id: newComment.id.toString(),
            article_id: newComment.article_id.toString(),
            user_id: newComment.user_id.toString(),
            parent_id: newComment.parent_id?.toString()
        }
        res.status(201).json(responseData)
    } catch(error) {
        console.error('创建评论失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
})

export default router