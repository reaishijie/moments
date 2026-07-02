import { randomUUID, createHash } from 'node:crypto'
import type { Request } from 'express'
import { prisma } from '../lib/prisma.js'
import { ACCESS_TOKEN_TTL_SECONDS, AUTH_TOKEN_SCOPE, REFRESH_TOKEN_TTL_SECONDS, tokenService, TokenService } from './token.service.js'
import { sessionService, SessionService } from './session.service.js'

function secondsFromNow(seconds: number) {
  return new Date(Date.now() + seconds * 1000)
}

export function buildDeviceFingerprint(req: Request) {
  const userAgent = req.headers['user-agent'] || ''
  const forwardedFor = req.headers['x-forwarded-for']
  const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor || req.ip || ''
  return createHash('sha256').update(`${ip}|${userAgent}`).digest('hex').slice(0, 64)
}

export class AuthService {
  constructor(
    private readonly tokens: TokenService = tokenService,
    private readonly sessions: SessionService = sessionService,
  ) {}

  async issueTokenPair(input: { userId: bigint; deviceFingerprint?: string | null }) {
    const sid = randomUUID()
    const accessJti = this.tokens.createJti()
    const refreshJti = this.tokens.createJti()
    const deviceId = input.deviceFingerprint ?? undefined

    await this.sessions.createSession({
      userId: input.userId,
      sid,
      deviceFingerprint: input.deviceFingerprint ?? null,
      accessJti,
      refreshJti,
      status: 'active',
      accessExpiresAt: secondsFromNow(ACCESS_TOKEN_TTL_SECONDS),
      refreshExpiresAt: secondsFromNow(REFRESH_TOKEN_TTL_SECONDS),
    })

    return {
      accessToken: this.tokens.signToken({ userId: input.userId, tokenType: 'access', sid, jti: accessJti, deviceId }),
      refreshToken: this.tokens.signToken({ userId: input.userId, tokenType: 'refresh', sid, jti: refreshJti, deviceId }),
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    }
  }

  async refresh(refreshToken: string) {
    const decoded = this.tokens.verify(refreshToken)
    if (decoded.scope !== AUTH_TOKEN_SCOPE || decoded.tokenType !== 'refresh') {
      throw new Error('Invalid refresh token')
    }
    if (!decoded.sub || !decoded.sid || !decoded.jti) {
      throw new Error('Invalid refresh token')
    }

    const resolvedSid = await this.sessions.resolveSidByRefreshJti(decoded.jti)
    if (!resolvedSid || resolvedSid !== decoded.sid) {
      throw new Error('Invalid refresh token')
    }

    const session = await this.sessions.getSession(decoded.sid)
    if (!session || session.status !== 'active' || session.userId.toString() !== decoded.sub) {
      throw new Error('Invalid refresh token')
    }

    const user = await ensureLoginAllowedUser(decoded.sub)
    if (!user) {
      throw new Error('Invalid refresh token')
    }

    const accessJti = this.tokens.createJti()
    const refreshJti = this.tokens.createJti()
    const ok = await this.sessions.rotateJtis(decoded.sid, decoded.jti, {
      accessJti,
      refreshJti,
      accessExpiresAt: secondsFromNow(ACCESS_TOKEN_TTL_SECONDS),
      refreshExpiresAt: secondsFromNow(REFRESH_TOKEN_TTL_SECONDS),
    })
    if (!ok) {
      throw new Error('Invalid refresh token')
    }

    const deviceId = session.deviceFingerprint ?? undefined
    return {
      accessToken: this.tokens.signToken({ userId: decoded.sub, tokenType: 'access', sid: decoded.sid, jti: accessJti, deviceId }),
      refreshToken: this.tokens.signToken({ userId: decoded.sub, tokenType: 'refresh', sid: decoded.sid, jti: refreshJti, deviceId }),
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    }
  }

  async revokeCurrentSession(input: { userId: string; sid: string }) {
    await this.sessions.revokeSession(BigInt(input.userId), input.sid)
  }

  async revokeAllSessions(userId: string) {
    await this.sessions.revokeAllSessions(BigInt(userId))
  }
}

export async function ensureLoginAllowedUser(userId: bigint | string) {
  const user = await prisma.users.findFirst({
    where: { id: BigInt(userId), deleted_at: null },
    select: { id: true, username: true, role: true, status: true, banned_until: true },
  })
  if (!user) return null

  if (user.status === 2 && user.banned_until && user.banned_until <= new Date()) {
    const unbannedUser = await prisma.users.update({
      where: { id: user.id },
      data: { status: 1, banned_until: null },
      select: { id: true, username: true, role: true, status: true, banned_until: true },
    })
    return unbannedUser
  }

  return user.status === 1 ? user : null
}

export const authService = new AuthService()
