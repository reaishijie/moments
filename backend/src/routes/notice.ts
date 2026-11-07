import { Router, Request, Response } from "express";
import { sendVerificationEmail, verify } from "../services/mail.service.js";
import { issueCaptchaProof, verifyCaptcha } from "../services/verify.service.js";
import { Logger } from "../utils/logger.js";
import { rateLimit } from "../middleware/rateLimit.middleware.js";
const router = Router()
const logger = new Logger('NoticeRoute')

function normalizeEmail(value: unknown) {
    return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

// 同一 IP 的邮件发送总量限制
const emailIpLimit = rateLimit({
    bucket: 'notice-send-email-ip',
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: '邮件发送过于频繁，请稍后再试',
})

// 同一收件邮箱的限制，避免对单个邮箱进行轰炸
const emailTargetLimit = rateLimit({
    bucket: 'notice-send-email-target',
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: '该邮箱验证码发送过于频繁，请稍后再试',
    keyGenerator: (req: Request) => normalizeEmail(req.body?.email) || null,
})

// 人机验证接口限流，避免被刷爆第三方校验额度
const captchaLimit = rateLimit({
    bucket: 'notice-captcha-ip',
    windowMs: 60 * 1000,
    max: 20,
    message: '人机验证过于频繁，请稍后再试',
})

router.post('/sendEmail', emailIpLimit, emailTargetLimit, async (req: Request, res: Response) => {
    const email = normalizeEmail(req.body?.email)
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ status: false, message: "邮箱格式不正确" })
    }

    try {
        const result = await sendVerificationEmail(email)
        if (result) {
            res.status(200).json({ status: true, message: "发送成功" })
            return
        }
        res.status(400).json({ status: false, message: "发送失败" })
    } catch (error) {
        logger.error('发送邮件失败', error instanceof Error ? error.stack : String(error))
        res.status(400).json({ status: false, message: "发送失败" })
    }
})

router.post('/verifyEmail', (req: Request, res: Response) => {
    const data = req.body
    try {
        const result = verify(data)
        logger.debug(`邮箱验证码校验结果：${result}`)
        if (result) {
            res.status(200).json({ status: true, message: "验证成功" })
            return
        }
        res.status(400).json({ status: false, message: "验证失败" })
    } catch (error) {
        logger.error('邮箱验证码校验失败', error instanceof Error ? error.stack : String(error))
        res.status(400).json({ status: false, message: "验证失败" })
    }
})

async function handleCaptchaVerification(
    req: Request,
    res: Response,
    verifier: (token: string, remoteIp?: string) => Promise<boolean>,
) {
    const { captchaToken } = req.body

    if (typeof captchaToken !== 'string' || !captchaToken.trim()) {
        return res.status(400).json({ status: false, message: '人机验证令牌缺失' })
    }
    try {
        const isVerified = await verifier(captchaToken, req.ip)
        if (isVerified) {
            const captchaProof = issueCaptchaProof(req.ip)
            return res.status(200).json({ status: true, message: "验证成功", captchaProof })
        } else {
            return res.status(400).json({ status: false, message: "验证失败" })
        }
    } catch (error) {
        logger.error('人机验证路由处理错误', error instanceof Error ? error.stack : String(error))
        return res.status(500).json({ status: false, message: '服务器内部错误' })
    }
}

router.post('/captcha', captchaLimit, async (req: Request, res: Response) => {
    return handleCaptchaVerification(req, res, verifyCaptcha)
})

// 保留旧接口，避免已部署的旧前端在后端升级后立即失效。
router.post('/hcaptcha', captchaLimit, async (req: Request, res: Response) => {
    return handleCaptchaVerification(req, res, verifyCaptcha)
})

export default router
