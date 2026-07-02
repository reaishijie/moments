import { Request, Response, NextFunction } from 'express'
import { JwtPayload } from '../types/express.js'
import { Logger } from '../utils/logger.js'
import { ensureLoginAllowedUser } from '../services/auth.service.js'
import { AUTH_TOKEN_SCOPE, tokenService } from '../services/token.service.js'
import { sessionService } from '../services/session.service.js'

const logger = new Logger('OptionalAuthMiddleware')

export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim()

    try {
      const decodedPayload = tokenService.verify(token)
      if (decodedPayload.tokenType !== 'access' || decodedPayload.scope !== AUTH_TOKEN_SCOPE) {
        return next()
      }
      if (!decodedPayload.sub || !decodedPayload.sid || !decodedPayload.jti) {
        return next()
      }

      const validSession = await sessionService.validateAccess({
        sid: decodedPayload.sid,
        jti: decodedPayload.jti,
        userId: decodedPayload.sub,
      })
      if (!validSession) {
        return next()
      }

      const user = await ensureLoginAllowedUser(decodedPayload.sub)
      if (user) {
        req.user = {
          userId: user.id.toString(),
          username: user.username,
          role: user.role,
          sid: decodedPayload.sid,
          jti: decodedPayload.jti,
          scope: decodedPayload.scope,
          tokenType: decodedPayload.tokenType,
        } satisfies JwtPayload
      }
    } catch (error) {
      logger.warn('捕获到无效的Token，按游客处理')
    }
  }

  next()
}
