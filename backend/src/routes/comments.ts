import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/authMiddleware";
import { error } from "console";
import { connect } from "http2";

const router = Router()
const prisma = new PrismaClient()

// 创建一条评论 需要登录
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId
        const { articleId, content, parentId } = req.body
        console.log("articleId", typeof articleId);

        // 验证输入
        if (!articleId || !content) {
            return res.status(400).json({ error: '文章ID和评论内容不能为空' })
        }
        // 子评论
        if (parentId) {
            // 父评论
            const parentComment = await prisma.comments.findUnique({
                where: { id: BigInt(parentId) }
            });
            console.log("parentComment", parentComment);

            // 检查父评论是否存在
            if (!parentComment) {
                return res.status(404).json({ error: '您回复的评论不存在' });
            }

            // 检查父评论的文章ID是否与当前提交的文章ID一致
            if (parentComment.article_id.toString() !== articleId.toString()) {
                return res.status(400).json({ error: '回复的评论与文章不匹配' });
            }
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
        if (!article) {
            return res.status(404).json({ error: '文章不存在或未发布' })
        }
        // 使用 prisma 事务来保证数据一致性（都成功/失败）
        const [newComment, updateArticle] = await prisma.$transaction([
            // 创建新评论
            prisma.comments.create({
                data: {
                    content,
                    article: { connect: { id: BigInt(articleId) } },
                    user: { connect: { id: BigInt(userId!) } },
                    ...(parentId && { parent: { connect: { id: BigInt(parentId) } } })
                }
            }),
            // 更新文章评论计数
            prisma.articles.update({
                where: { id: BigInt(articleId) },
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
    } catch (error) {
        console.error('创建评论失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
})

// 删除自己的评论
router.delete('/:commentId', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId
        const { commentId } = req.params

        // 查找评论是否存在
        const comment = await prisma.comments.findUnique({
            where: { id: BigInt(commentId) }
        });

        if (!comment) {
            return res.status(404).json({ error: '评论未找到' })
        }

        // 验证当前登录用户是否是评论的作者 （需登录）
        if (comment.user_id.toString() !== userId) {
            return res.status(403).json({ error: '无权删除此评论' })
        }

        const repliesCount = await prisma.comments.count({
            where: { parent_id: BigInt(commentId), deleted_at: null }
        });
        // 总评论数 （一条父评论及其子评论）
        const totalCountToDecrement = 1 + repliesCount;

        //  使用事务执行软删除和更新文章评论计数
        await prisma.$transaction([
            // 软删除其子评论
            prisma.comments.updateMany({
                where: { parent_id: BigInt(commentId), deleted_at:null },
                data: { deleted_at: new Date() }
            }),
            // 软删除父评论
            prisma.comments.update({
                where: { id: BigInt(commentId) },
                data: { deleted_at: new Date() }
            }),
            // 更新文章的评论计数
            prisma.articles.update({
                where: { id: comment.article_id },
                data: {
                    comment_count: {
                        decrement: totalCountToDecrement
                    }
                }
            })
        ]);

        res.status(204).send()

    } catch (error) {
        console.error('删除评论失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

export default router