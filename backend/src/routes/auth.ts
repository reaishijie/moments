import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { logAction, logger } from "../services/log.service.js"
import { verifyAndConsume } from "../services/mail.service.js";
import { Logger } from "../utils/logger.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { authService, buildDeviceFingerprint, ensureLoginAllowedUser } from "../services/auth.service.js";

const router = Router()
const authLogger = new Logger('AuthRoute')

async function isRegisterEmailVerificationEnabled() {
    const config = await prisma.config.findUnique({
        where: { k: 'user_email_verify_register' },
        select: { v: true },
    })
    return config?.v === '1'
}

async function hashPassword(rawPassword: string) {
    const { default: bcrypt } = await import('bcrypt')
    return bcrypt.hash(rawPassword, 10)
}

async function writeLoginFailLog(req: Request, userId: bigint | null, error: string) {
    await logger.add({
        userId,
        action: logAction.USER_LOGIN_FAILD,
        targetType: 'users',
        targetId: userId,
        status: 'FAILED',
        details: { error },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
    })
}

function normalizeEmail(email: unknown) {
    return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

function isEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// 注册
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { username, password: rawPassword, status, code } = req.body
        const email = normalizeEmail(req.body.email)

        // 验证输入
        if (!username || !rawPassword) {
            return res.status(400).json({ error: '用户名、密码不能为空' })
        }

        const needsEmailVerify = await isRegisterEmailVerificationEnabled()
        if (needsEmailVerify && (!email || !isEmail(email))) {
            return res.status(400).json({ error: '请填写有效邮箱' })
        }

        // 检查用户是否已存在
        const existingUser = await prisma.users.findFirst({
            where: {
                OR: [
                    { username: username },
                    ...(email ? [{ email }] : [])
                ]
            }
        })
        if (existingUser) {
            return res.status(409).json({ error: '用户名或邮箱已被注册' })
        }

        if (needsEmailVerify && (!code || !verifyAndConsume({ email, code: String(code) }))) {
            return res.status(400).json({ error: '邮箱验证码错误或已过期' })
        }
        // 哈希密码
        const hashedPassword = await hashPassword(rawPassword)

        // 创建新用户
        const newUser = await prisma.users.create({
            data: {
                username: username,
                password: hashedPassword,
                email: email || null,
                status: status || 0, //默认注册后 0为未激活 | 1为正常用户 | 2为封禁
            }
        })
        // 将新用户信息除去密码后返回
        const { password, ...userInfo } = newUser
        const responseUser = {
            ...userInfo,
            id: Number(userInfo.id)
        }
        logger.add({
            userId: BigInt(responseUser.id),
            action: logAction.USER_REGISTER_SUCCESS,
            targetType: 'users',
            targetId: BigInt(responseUser.id),
            details: responseUser,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || '',
        })
        return res.status(201).json(responseUser)
    } catch (error) {
        authLogger.error('注册失败', error instanceof Error ? error.stack : String(error))
        res.status(500).json({ error: '服务器内部错误！' })
    }
})

// 密码登录
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { identifier, password } = req.body
        // 验证输入
        if (!identifier || !password) {
            return res.status(400).json({ error: '请输入信息' })
        }
        // 查找用户信息
        const user = await prisma.users.findFirst({
            where: {
                OR: [
                    { username: identifier },
                    { email: identifier }
                ]
            }
        })
        if (!user) {
            await writeLoginFailLog(req, null, '账号或密码错误')
            return res.status(401).json({ error: '账号或密码错误' })
        }
        // 验证密码
        const { default: bcrypt } = await import('bcrypt')
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            await writeLoginFailLog(req, BigInt(user.id), '账号或密码错误')
            return res.status(401).json({ error: '账号或密码错误' });
        }
        // 检查用户状态是否正常 0未激活，1正常，2封禁；封禁到期后自动恢复
        const loginAllowedUser = await ensureLoginAllowedUser(user.id)
        if (!loginAllowedUser) {
            await writeLoginFailLog(req, BigInt(user.id), '用户状态异常，无法登录')
            return res.status(403).json({ error: '用户状态异常，无法登录' });
        }
        // 生成双令牌
        const tokens = await authService.issueTokenPair({
            userId: user.id,
            deviceFingerprint: buildDeviceFingerprint(req),
        })

        logger.add({
            userId: BigInt(user.id),
            action: logAction.USER_LOGIN_SUCCESS,
            targetType: 'users',
            targetId: BigInt(user.id),
            details: { userId: user.id.toString(), username: user.username },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || '',
        })
        res.status(200).json(tokens)

    } catch (error) {
        authLogger.error('登录失败', error instanceof Error ? error.stack : String(error))
        res.status(500).json({ error: '服务器内部错误' })
    }
})

// 邮箱验证码登录
router.post('/login-email', async (req: Request, res: Response) => {
    try {
        const email = normalizeEmail(req.body.email)
        const code = String(req.body.code || '')

        if (!email || !code) {
            return res.status(400).json({ error: '邮箱和验证码不能为空' })
        }
        if (!isEmail(email)) {
            return res.status(400).json({ error: '邮箱格式不正确' })
        }
        if (!verifyAndConsume({ email, code })) {
            await writeLoginFailLog(req, null, '邮箱验证码错误或已过期')
            return res.status(401).json({ error: '邮箱验证码错误或已过期' })
        }

        const user = await prisma.users.findUnique({ where: { email } })
        if (!user) {
            await writeLoginFailLog(req, null, '邮箱未注册')
            return res.status(404).json({ error: '邮箱未注册' })
        }
        const loginAllowedUser = await ensureLoginAllowedUser(user.id)
        if (!loginAllowedUser) {
            await writeLoginFailLog(req, BigInt(user.id), '用户状态异常，无法登录')
            return res.status(403).json({ error: '用户状态异常，无法登录' });
        }

        const tokens = await authService.issueTokenPair({
            userId: user.id,
            deviceFingerprint: buildDeviceFingerprint(req),
        })
        logger.add({
            userId: BigInt(user.id),
            action: logAction.USER_LOGIN_SUCCESS,
            targetType: 'users',
            targetId: BigInt(user.id),
            details: { userId: user.id.toString(), username: user.username, method: 'email_code' },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || '',
        })
        return res.status(200).json(tokens)
    } catch (error) {
        authLogger.error('邮箱验证码登录失败', error instanceof Error ? error.stack : String(error))
        return res.status(500).json({ error: '服务器内部错误' })
    }
})

// 刷新令牌：仅接受 refreshToken，并在每次刷新时轮换 refresh jti
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const refreshToken = String(req.body.refreshToken || '')
        if (!refreshToken) {
            return res.status(400).json({ error: 'refreshToken 不能为空' })
        }

        const tokens = await authService.refresh(refreshToken)
        return res.status(200).json(tokens)
    } catch (error) {
        authLogger.warn('刷新令牌失败')
        return res.status(401).json({ error: '登录已过期，请重新登录' })
    }
})

// 退出当前会话
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
    try {
        if (!req.user?.userId || !req.user.sid) {
            return res.status(401).json({ error: '未授权' })
        }

        await authService.revokeCurrentSession({ userId: req.user.userId, sid: req.user.sid })
        return res.status(200).json({ message: '已退出登录' })
    } catch (error) {
        authLogger.error('退出登录失败', error instanceof Error ? error.stack : String(error))
        return res.status(500).json({ error: '服务器内部错误' })
    }
})

// 退出全部会话
router.post('/logout-all', authMiddleware, async (req: Request, res: Response) => {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ error: '未授权' })
        }

        await authService.revokeAllSessions(req.user.userId)
        return res.status(200).json({ message: '已退出全部设备' })
    } catch (error) {
        authLogger.error('退出全部会话失败', error instanceof Error ? error.stack : String(error))
        return res.status(500).json({ error: '服务器内部错误' })
    }
})

// 调试当前 token 类型，拒绝 refresh token 访问普通接口
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
    return res.status(200).json({ user: req.user })
})

// 邮箱验证码重置密码
router.post('/reset-password', async (req: Request, res: Response) => {
    try {
        const email = normalizeEmail(req.body.email)
        const code = String(req.body.code || '')
        const newPassword = String(req.body.password || '')

        if (!email || !code || !newPassword) {
            return res.status(400).json({ error: '邮箱、验证码和新密码不能为空' })
        }
        if (!isEmail(email)) {
            return res.status(400).json({ error: '邮箱格式不正确' })
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: '密码不能小于 6 位' })
        }
        if (!verifyAndConsume({ email, code })) {
            return res.status(400).json({ error: '邮箱验证码错误或已过期' })
        }

        const user = await prisma.users.findUnique({ where: { email } })
        if (!user) {
            return res.status(404).json({ error: '邮箱未注册' })
        }

        const hashedPassword = await hashPassword(newPassword)
        await prisma.users.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        })

        return res.status(200).json({ message: '密码已重置' })
    } catch (error) {
        authLogger.error('重置密码失败', error instanceof Error ? error.stack : String(error))
        return res.status(500).json({ error: '服务器内部错误' })
    }
})

export default router
