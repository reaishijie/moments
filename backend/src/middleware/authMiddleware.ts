import { Request, Response, NextFunction } from "express"
import { JwtPayload } from "../types/express.js"
import { ensureLoginAllowedUser } from "../services/auth.service.js"
import { AUTH_TOKEN_SCOPE, tokenService } from "../services/token.service.js"
import { sessionService } from "../services/session.service.js"

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未提供认证令牌或认证令牌格式错误' })
    }

    const token = authHeader.slice('Bearer '.length).trim()

    try {
        const decodedPayload = tokenService.verify(token)
        if (decodedPayload.tokenType !== 'access' || decodedPayload.scope !== AUTH_TOKEN_SCOPE) {
            return res.status(401).json({ error: '无效或已过期的令牌' })
        }
        if (!decodedPayload.sub || !decodedPayload.sid || !decodedPayload.jti) {
            return res.status(401).json({ error: '无效或已过期的令牌' })
        }

        const validSession = await sessionService.validateAccess({
            sid: decodedPayload.sid,
            jti: decodedPayload.jti,
            userId: decodedPayload.sub,
        })
        if (!validSession) {
            return res.status(401).json({ error: '登录会话已失效，请重新登录' })
        }

        const user = await ensureLoginAllowedUser(decodedPayload.sub)
        if (!user) {
            return res.status(401).json({ error: '用户不存在或状态异常' })
        }

        req.user = {
            userId: user.id.toString(),
            username: user.username,
            role: user.role,
            sid: decodedPayload.sid,
            jti: decodedPayload.jti,
            scope: decodedPayload.scope,
            tokenType: decodedPayload.tokenType,
        } satisfies JwtPayload
        next()
    } catch(error) {
         return res.status(401).json({ error: '无效或已过期的令牌' })
    }
}
