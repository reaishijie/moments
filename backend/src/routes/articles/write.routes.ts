import { Router, Request, Response } from 'express'
import { Logger } from '../../utils/logger.js'
import { Prisma } from '@prisma/client'
import { articleInclude, normalizeTagNames, replaceArticleMedia, replaceArticleTags, serializeArticle } from './shared.js'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import { logAction } from "../../services/log.service.js"
import { logger } from "../../services/log.service.js"
import { prisma } from '../../lib/prisma.js'
import { toBigInt } from '../../utils/parseId.js'
import { verifyCaptchaProofForAction } from '../../services/verify.service.js'

const routeLogger = new Logger('ArticlesWriteRoute')
const router = Router()

// 创建一篇文章
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { content, status, location, type, isTop, isAd, adTitle, adUrl, imageUrls, videoUrls, thumbnail_url, tags } = req.body;
        if (!content && !imageUrls && !videoUrls) {
            return res.status(400).json({ error: '文章内容不能为空' });
        }
        const captchaVerified = await verifyCaptchaProofForAction('user_captcha_article', req.body.captchaProof, req.ip)
        if (!captchaVerified) {
            return res.status(400).json({ error: '请先完成人机验证' })
        }
        const isAdmin = req.user?.role === 1
        const tagNames = normalizeTagNames(tags);
        //创建一篇文章 ⭐⭐⭐⭐
        const newArticle = await prisma.$transaction(async (tx) => {
            // 操作文章表
            const createdArticle = await tx.articles.create({
                data: {
                    content,
                    status,
                    location,
                    type,
                    is_top: isAdmin ? !!isTop : false,
                    is_ad: isAdmin ? !!isAd : false,
                    ad_title: isAdmin ? adTitle : null,
                    ad_url: isAdmin ? adUrl : null,
                    user: {
                        connect: { id: BigInt(userId!), }
                    }
                },
                include: articleInclude
            })
            await replaceArticleTags(tx, createdArticle.id, tagNames, BigInt(userId!));
            // 操作视频（填写外链）
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
                    thumbnail_url,
                    sort_order: index
                }))
                await tx.article_videos.createMany({ data: videoData })
            }
            return tx.articles.findUniqueOrThrow({
                where: { id: createdArticle.id },
                include: articleInclude
            })
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
        res.status(201).json(serializeArticle(newArticle));
    } catch (error) {
        routeLogger.error('创建文章失败:', error instanceof Error ? error.stack : String(error));
        res.status(500).json({ error: '服务器内部错误' });
    }
})

// 更新一篇自己的文章（需要身份认证或管理员 role = 1）
router.patch('/:articleId', authMiddleware, async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ status: false, message: '请重新登录' })
        }
        if(req.body === undefined) {
            return res.status(400).json({ status: false, message: '请求数据格式错误' })
        }
        const userId = req.user?.userId
        const articleId = toBigInt(req.params.articleId)
        if (articleId === null) {
            return res.status(400).json({ error: '文章ID不合法' })
        }
        const { content, status, location, type, isAd, isTop, adTitle, adUrl, imageUrls, videoUrls, thumbnail_url, tags } = req.body
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
        if (article.user_id.toString() !== userId && req.user.role !== 1) {
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
            return res.status(403).json({ status: false, error: '无权修改此文章' })
        }
        const isAdmin = req.user.role === 1
        const isEditExpired = Date.now() - article.created_at.getTime() > 24 * 60 * 60 * 1000
        if (!isAdmin && isEditExpired) {
            logger.add({
                userId: BigInt(userId!),
                action: logAction.ARTICLE_UPDATE,
                targetType: 'articles',
                targetId: BigInt(articleId),
                status: 'FAILED',
                details: { error: '文章发布超过1天后不能编辑' },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'] || '',
            })
            return res.status(403).json({ status: false, error: '文章发布超过1天后不能编辑' })
        }
        // 构建更新数据
        const updateData: Prisma.articlesUpdateInput = {}
        // 字段显式传入时更新，允许清空内容/位置
        if (content !== undefined) updateData.content = content
        if (location !== undefined) updateData.location = location
        if (type !== undefined) updateData.type = type
        // 管理字段仅管理员可修改，避免普通作者自行置顶/广告/下架
        if (adTitle !== undefined) {
            if (!isAdmin) return res.status(403).json({ status: false, error: '无权修改广告信息' })
            updateData.ad_title = adTitle
        }
        if (adUrl !== undefined) {
            if (!isAdmin) return res.status(403).json({ status: false, error: '无权修改广告信息' })
            updateData.ad_url = adUrl
        }
        if (status !== undefined) {
            if (!isAdmin) return res.status(403).json({ status: false, error: '无权修改文章状态' })
            updateData.status = status
        }
        if (isAd !== undefined) {
            if (!isAdmin) return res.status(403).json({ status: false, error: '无权设置广告' })
            updateData.is_ad = isAd
        }
        if (isTop !== undefined) {
            if (!isAdmin) return res.status(403).json({ status: false, error: '无权设置置顶' })
            updateData.is_top = isTop
        }
        const updateArticle = await prisma.$transaction(async (tx) => {
            await tx.articles.update({
                where: {
                    id: BigInt(articleId)
                },
                data: updateData
            })
            if (tags !== undefined) {
                await replaceArticleTags(tx, BigInt(articleId), normalizeTagNames(tags), BigInt(userId))
            }
            await replaceArticleMedia(tx, BigInt(articleId), imageUrls, videoUrls)
            if (thumbnail_url !== undefined && videoUrls !== undefined) {
                await tx.article_videos.updateMany({
                    where: { article_id: BigInt(articleId) },
                    data: { thumbnail_url }
                })
            }
            return tx.articles.findUniqueOrThrow({
                where: { id: BigInt(articleId) },
                include: articleInclude
            })
        })
        // 数据格式转换
        const responseData = serializeArticle(updateArticle)
        logger.add({
            userId: BigInt(userId),
            action: logAction.ARTICLE_UPDATE,
            targetType: 'articles',
            targetId: BigInt(articleId),
            details: responseData,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || '',
        })
        res.status(200).json({ status: true, message: '更新成功', data: responseData})
    } catch (error) {
        routeLogger.error('更新文章失败:', error instanceof Error ? error.stack : String(error));
        res.status(500).json({ error: '服务器内部错误' });
    }
})

// 删除一篇自己的文章，（需要身份认证或管理员 role = 1）
router.delete('/:articleId', authMiddleware, async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ status: false, message: '请重新登录' })
        }
        const userId = req.user.userId;
        const articleId = toBigInt(req.params.articleId)
        if (articleId === null) {
            return res.status(400).json({ error: '文章ID不合法' })
        }

        const article = await prisma.articles.findUnique({
            where: { id: BigInt(articleId) }
        });

        if (!article) {
            return res.status(404).json({ error: '文章未找到' });
        }

        if (article.user_id.toString() !== userId && req.user.role !== 1) {
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
        })
        res.status(204).send();
    } catch (error) {
        routeLogger.error('删除文章失败:', error instanceof Error ? error.stack : String(error));
        res.status(500).json({ error: '服务器内部错误' });
    }
})

export default router
