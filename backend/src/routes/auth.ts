import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { logAction, logger } from "../services/log.service.js"
import { verifyAndConsume } from "../services/mail.service.js";
import { Logger } from "../utils/logger.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { authService, buildDeviceFingerprint, ensureLoginAllowedUser } from "../services/auth.service.js";
import { oauthService } from "../services/oauth.service.js";
import { verifyCaptchaProofForAction } from "../services/verify.service.js";
import {
    clearRefreshTokenCookie,
    REFRESH_TOKEN_COOKIE_NAME,
    setRefreshTokenCookie,
    toPublicTokenResponse,
} from '../utils/authCookie.js'
import { isRequestOriginTrusted } from '../utils/requestOrigin.js'

const router = Router()
const authLogger = new Logger('AuthRoute')

type TokenPair = Awaited<ReturnType<typeof authService.issueTokenPair>>

router.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS' || isRequestOriginTrusted(req)) {
        return next()
    }
    return res.status(403).json({ error: '请求来源不受信任' })
})

function sendTokenResponse(req: Request, res: Response, status: number, tokens: TokenPair) {
    setRefreshTokenCookie(req, res, tokens.refreshToken)
    return res.status(status).json(toPublicTokenResponse(tokens))
}

function isTokenPair(result: unknown): result is TokenPair {
    if (!result || typeof result !== 'object') return false
    const value = result as Partial<TokenPair>
    return typeof value.accessToken === 'string'
        && typeof value.refreshToken === 'string'
        && typeof value.expiresIn === 'number'
}

async function requireUserCaptcha(req: Request, res: Response) {
    const verified = await verifyCaptchaProofForAction('user_captcha', req.body.captchaProof, req.ip)
    if (!verified) {
        res.status(400).json({ error: '请先完成人机验证' })
    }
    return verified
}

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

async function getDefaultUserStatus() {
    const config = await prisma.config.findUnique({ where: { k: 'user_status' }, select: { v: true } })
    const status = Number(config?.v ?? 0)
    return Number.isInteger(status) && status >= 0 ? status : 0
}

function normalizeUsername(username: unknown) {
    return typeof username === 'string' ? username.trim() : ''
}

function normalizeUsernameSeed(seed: string) {
    const normalized = seed
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 24)
    return normalized.length >= 3 ? normalized : `user-${Date.now().toString(36)}`
}

async function generateUniqueUsername(seed: string) {
    const base = normalizeUsernameSeed(seed)
    let username = base
    for (let index = 0; index < 10; index += 1) {
        const exists = await prisma.users.findUnique({ where: { username }, select: { id: true } })
        if (!exists) return username
        const suffix = `${Date.now().toString(36).slice(-4)}${index}`
        username = `${base.slice(0, Math.max(3, 30 - suffix.length - 1))}-${suffix}`
    }
    return `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.slice(0, 30)
}

function sendOAuthResult(req: Request, res: Response, result: unknown) {
    let payload = result
    if (isTokenPair(result)) {
        setRefreshTokenCookie(req, res, result.refreshToken)
        payload = { authenticated: true }
    }

    if (req.query.format === 'json') {
        return res.status(200).json(payload)
    }

    const serializedPayload = JSON.stringify({ type: 'moments-oauth-result', payload }).replace(/</g, '\\u003c')
    return res.status(200).type('html').send(`<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"><title>OAuth 登录完成</title></head>
<body>
<script>
(function () {
  var message = ${serializedPayload};
  try {
    window.sessionStorage.setItem('moments_oauth_result', JSON.stringify(message.payload));
  } catch (error) {}

  if (window.opener) {
    window.opener.postMessage(message, window.location.origin);
    window.close();
    return;
  }

  var returnPath = '/';
  try {
    returnPath = window.sessionStorage.getItem('moments_oauth_return_path') || '/';
    window.sessionStorage.removeItem('moments_oauth_return_path');
  } catch (error) {}
  window.location.replace(returnPath);
})();
</script>
</body>
</html>`)
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

        if (email && !isEmail(email)) {
            return res.status(400).json({ error: '邮箱格式不正确' })
        }
        const needsEmailVerify = await isRegisterEmailVerificationEnabled()
        if (needsEmailVerify && !email) {
            return res.status(400).json({ error: '请填写有效邮箱' })
        }
        if (!await requireUserCaptcha(req, res)) return

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
        if (!await requireUserCaptcha(req, res)) return
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
        return sendTokenResponse(req, res, 200, tokens)

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
        if (!await requireUserCaptcha(req, res)) return
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
        return sendTokenResponse(req, res, 200, tokens)
    } catch (error) {
        authLogger.error('邮箱验证码登录失败', error instanceof Error ? error.stack : String(error))
        return res.status(500).json({ error: '服务器内部错误' })
    }
})

router.get('/oauth/linux-do/login', async (req: Request, res: Response) => {
    try {
        const url = await oauthService.buildLinuxDoAuthorizeUrl(req)
        if (req.query.redirect === '1') {
            return res.redirect(url)
        }
        return res.status(200).json({ url })
    } catch (error) {
        authLogger.warn(error instanceof Error ? error.message : 'Linux.Do OAuth 发起失败')
        return res.status(400).json({ error: error instanceof Error ? error.message : 'Linux.Do OAuth 发起失败' })
    }
})

router.get('/oauth/linux-do/callback', async (req: Request, res: Response) => {
    try {
        const code = String(req.query.code || '')
        const state = typeof req.query.state === 'string' ? req.query.state : undefined
        if (!code) return res.status(400).json({ error: '缺少授权码' })

        const profile = await oauthService.fetchLinuxDoProfile({ code, state, req })
        const result = await oauthService.loginOrCreateTicket(profile, req)
        return sendOAuthResult(req, res, result)
    } catch (error) {
        authLogger.error('Linux.Do OAuth 回调失败', error instanceof Error ? error.stack : String(error))
        return res.status(400).json({ error: error instanceof Error ? error.message : 'Linux.Do OAuth 回调失败' })
    }
})

router.get('/oauth/nodeloc/login', async (req: Request, res: Response) => {
    try {
        const url = await oauthService.buildNodelocAuthorizeUrl(req)
        if (req.query.redirect === '1') {
            return res.redirect(url)
        }
        return res.status(200).json({ url })
    } catch (error) {
        authLogger.warn(error instanceof Error ? error.message : 'NodeLoc OAuth 发起失败')
        return res.status(400).json({ error: error instanceof Error ? error.message : 'NodeLoc OAuth 发起失败' })
    }
})

router.get('/oauth/nodeloc/callback', async (req: Request, res: Response) => {
    try {
        const code = String(req.query.code || '')
        const state = typeof req.query.state === 'string' ? req.query.state : undefined
        if (!code) return res.status(400).json({ error: '缺少授权码' })

        const profile = await oauthService.fetchNodelocProfile({ code, state, req })
        const result = await oauthService.loginOrCreateTicket(profile, req)
        return sendOAuthResult(req, res, result)
    } catch (error) {
        authLogger.error('NodeLoc OAuth 回调失败', error instanceof Error ? error.stack : String(error))
        return res.status(400).json({ error: error instanceof Error ? error.message : 'NodeLoc OAuth 回调失败' })
    }
})

router.get('/oauth/google/login', async (req: Request, res: Response) => {
    try {
        const url = await oauthService.buildGoogleAuthorizeUrl(req)
        if (req.query.redirect === '1') {
            return res.redirect(url)
        }
        return res.status(200).json({ url })
    } catch (error) {
        authLogger.warn(error instanceof Error ? error.message : 'Google OAuth 发起失败')
        return res.status(400).json({ error: error instanceof Error ? error.message : 'Google OAuth 发起失败' })
    }
})

router.get('/oauth/google/callback', async (req: Request, res: Response) => {
    try {
        const code = String(req.query.code || '')
        const state = typeof req.query.state === 'string' ? req.query.state : undefined
        if (!code) return res.status(400).json({ error: '缺少授权码' })

        const profile = await oauthService.fetchGoogleProfile({ code, state, req })
        const result = await oauthService.loginOrCreateTicket(profile, req)
        return sendOAuthResult(req, res, result)
    } catch (error) {
        authLogger.error('Google OAuth 回调失败', error instanceof Error ? error.stack : String(error))
        return res.status(400).json({ error: error instanceof Error ? error.message : 'Google OAuth 回调失败' })
    }
})

router.get('/oauth/github/login', async (req: Request, res: Response) => {
    try {
        const url = await oauthService.buildGithubAuthorizeUrl(req)
        if (req.query.redirect === '1') {
            return res.redirect(url)
        }
        return res.status(200).json({ url })
    } catch (error) {
        authLogger.warn(error instanceof Error ? error.message : 'GitHub OAuth 发起失败')
        return res.status(400).json({ error: error instanceof Error ? error.message : 'GitHub OAuth 发起失败' })
    }
})

router.get('/oauth/github/callback', async (req: Request, res: Response) => {
    try {
        const code = String(req.query.code || '')
        const state = typeof req.query.state === 'string' ? req.query.state : undefined
        if (!code) return res.status(400).json({ error: '缺少授权码' })

        const profile = await oauthService.fetchGithubProfile({ code, state, req })
        const result = await oauthService.loginOrCreateTicket(profile, req)
        return sendOAuthResult(req, res, result)
    } catch (error) {
        authLogger.error('GitHub OAuth 回调失败', error instanceof Error ? error.stack : String(error))
        return res.status(400).json({ error: error instanceof Error ? error.message : 'GitHub OAuth 回调失败' })
    }
})

router.get('/oauth/rainbow/:type/login', async (req: Request, res: Response) => {
    try {
        const result = await oauthService.buildRainbowLoginUrl(req, req.params.type)
        if (req.query.redirect === '1') {
            return res.redirect(result.url)
        }
        return res.status(200).json(result)
    } catch (error) {
        authLogger.warn(error instanceof Error ? error.message : '彩虹聚合登录发起失败')
        return res.status(400).json({ error: error instanceof Error ? error.message : '彩虹聚合登录发起失败' })
    }
})

router.get('/oauth/rainbow/callback', async (req: Request, res: Response) => {
    try {
        const code = String(req.query.code || '')
        const type = req.query.type
        if (!code) return res.status(400).json({ error: '缺少授权码' })

        const profile = await oauthService.fetchRainbowProfile({ code, type })
        const result = await oauthService.loginOrCreateTicket(profile, req)
        return sendOAuthResult(req, res, result)
    } catch (error) {
        authLogger.error('彩虹聚合登录回调失败', error instanceof Error ? error.stack : String(error))
        return res.status(400).json({ error: error instanceof Error ? error.message : '彩虹聚合登录回调失败' })
    }
})

router.get('/callback', async (req: Request, res: Response) => {
    try {
        const code = String(req.query.code || '')
        if (!code) return res.status(400).json({ error: '缺少授权码' })

        const profile = await oauthService.resolveCallbackProfile({
            code,
            state: typeof req.query.state === 'string' ? req.query.state : undefined,
            type: req.query.type,
            req,
        })
        const result = await oauthService.loginOrCreateTicket(profile, req)
        return sendOAuthResult(req, res, result)
    } catch (error) {
        authLogger.error('OAuth 兼容回调失败', error instanceof Error ? error.stack : String(error))
        return res.status(400).json({ error: error instanceof Error ? error.message : 'OAuth 回调失败' })
    }
})

router.post('/oauth/bind', authMiddleware, async (req: Request, res: Response) => {
    try {
        if (!req.user?.userId) return res.status(401).json({ error: '未授权' })
        const oauthTicket = String(req.body.oauthTicket || req.body.ticket || '')
        if (!oauthTicket) return res.status(400).json({ error: 'oauthTicket 不能为空' })

        await oauthService.bindTicketToUser({ ticket: oauthTicket, userId: BigInt(req.user.userId) })
        return res.status(200).json({ message: '第三方账号绑定成功' })
    } catch (error) {
        authLogger.warn(error instanceof Error ? error.message : '第三方账号绑定失败')
        return res.status(400).json({ error: error instanceof Error ? error.message : '第三方账号绑定失败' })
    }
})

router.post('/oauth/register-bind', async (req: Request, res: Response) => {
    try {
        const oauthTicket = String(req.body.oauthTicket || req.body.ticket || '')
        let username = normalizeUsername(req.body.username)
        const rawPassword = String(req.body.password || '')
        const email = normalizeEmail(req.body.email)
        const code = String(req.body.code || '')

        if (!oauthTicket || (!username && !email) || !rawPassword) {
            return res.status(400).json({ error: 'oauthTicket、密码不能为空，用户名和邮箱至少填写一项' })
        }
        if (email && !isEmail(email)) {
            return res.status(400).json({ error: '邮箱格式不正确' })
        }
        if (!username) {
            username = await generateUniqueUsername(email.split('@')[0])
        }
        if (username.length < 3 || username.length > 30) {
            return res.status(400).json({ error: '用户名长度需为 3-30 位' })
        }
        if (rawPassword.length < 6) {
            return res.status(400).json({ error: '密码不能小于 6 位' })
        }
        if (!await requireUserCaptcha(req, res)) return

        const needsEmailVerify = await isRegisterEmailVerificationEnabled()
        if (needsEmailVerify && (!email || !isEmail(email))) {
            return res.status(400).json({ error: '请填写有效邮箱' })
        }
        if (needsEmailVerify && (!code || !verifyAndConsume({ email, code }))) {
            return res.status(400).json({ error: '邮箱验证码错误或已过期' })
        }

        const existingUser = await prisma.users.findFirst({
            where: {
                OR: [
                    { username },
                    ...(email ? [{ email }] : [])
                ]
            }
        })
        if (existingUser) {
            return res.status(409).json({ error: '用户名或邮箱已被注册' })
        }

        const hashedPassword = await hashPassword(rawPassword)
        const status = await getDefaultUserStatus()
        const newUser = await prisma.users.create({
            data: { username, password: hashedPassword, email: email || null, status }
        })
        await oauthService.bindTicketToUser({ ticket: oauthTicket, userId: newUser.id })

        const loginAllowedUser = await ensureLoginAllowedUser(newUser.id)
        if (!loginAllowedUser) {
            return res.status(201).json({ message: '账号创建并绑定成功，请等待账号激活后登录' })
        }

        const tokens = await authService.issueTokenPair({
            userId: newUser.id,
            deviceFingerprint: buildDeviceFingerprint(req),
        })
        logger.add({
            userId: BigInt(newUser.id),
            action: logAction.USER_REGISTER_SUCCESS,
            targetType: 'users',
            targetId: BigInt(newUser.id),
            details: { userId: newUser.id.toString(), username, method: 'oauth_register_bind' },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || '',
        })
        return sendTokenResponse(req, res, 201, tokens)
    } catch (error) {
        authLogger.error('OAuth 注册绑定失败', error instanceof Error ? error.stack : String(error))
        return res.status(400).json({ error: error instanceof Error ? error.message : 'OAuth 注册绑定失败' })
    }
})

// 刷新令牌：仅接受 HttpOnly Cookie，并在每次刷新时轮换 refresh jti
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME]
        if (typeof refreshToken !== 'string' || !refreshToken) {
            return res.status(401).json({ error: '登录已过期，请重新登录' })
        }

        const tokens = await authService.refresh(refreshToken)
        return sendTokenResponse(req, res, 200, tokens)
    } catch (error) {
        authLogger.warn('刷新令牌失败')
        return res.status(401).json({ error: '登录已过期，请重新登录' })
    }
})

// 退出当前会话
router.post('/logout', (req: Request, res: Response, next: NextFunction) => {
    clearRefreshTokenCookie(req, res)
    next()
}, authMiddleware, async (req: Request, res: Response) => {
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
router.post('/logout-all', (req: Request, res: Response, next: NextFunction) => {
    clearRefreshTokenCookie(req, res)
    next()
}, authMiddleware, async (req: Request, res: Response) => {
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
