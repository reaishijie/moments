import { Router, Request, Response } from "express";
import { sendVerificationEmail, verify } from "../services/mail.service.js";
import { issueCaptchaProof, verifyCaptcha } from "../services/verify.service.js";
import { Logger } from "../utils/logger.js";
const router = Router()
const logger = new Logger('NoticeRoute')

router.post('/sendEmail', async (req: Request, res: Response) => {
    try {
        const result = await sendVerificationEmail(req.body.email)
        if (result) {
            res.status(200).json({ status: true, message: "发送成功" })
            return
        }
        res.status(400).json({ status: false, message: "发送失败" })
    } catch (error) {
        console.error('发送邮件失败：', error);
        res.status(400).json({ status: false, message: "发送失败" })
    }
})

router.post('/verifyEmail', (req: Request, res: Response) => {
    const data = req.body
    try {
        const result = verify(data)
        console.log('结果布尔值：', result);
        if (result) {
            res.status(200).json({ status: true, message: "验证成功" })
            return
        }
        res.status(400).json({ status: false, message: "验证失败" })
    } catch (error) {
        console.error('验证失败：', error);
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

router.post('/captcha', async (req: Request, res: Response) => {
    return handleCaptchaVerification(req, res, verifyCaptcha)
})

// 保留旧接口，避免已部署的旧前端在后端升级后立即失效。
router.post('/hcaptcha', async (req: Request, res: Response) => {
    return handleCaptchaVerification(req, res, verifyCaptcha)
})

export default router