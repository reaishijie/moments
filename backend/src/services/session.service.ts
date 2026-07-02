import { prisma } from '../lib/prisma.js'

export type SessionStatus = 'active' | 'revoked' | 'expired'

export type SessionRecord = {
  userId: bigint
  sid: string
  deviceFingerprint?: string | null
  accessJti: string
  refreshJti: string
  status: SessionStatus
  accessExpiresAt: Date
  refreshExpiresAt: Date
}

export class SessionService {
  async createSession(session: SessionRecord) {
    await prisma.user_sessions.create({
      data: {
        user_id: session.userId,
        session_id: session.sid,
        device_fingerprint: session.deviceFingerprint ?? null,
        access_jti: session.accessJti,
        refresh_jti: session.refreshJti,
        status: session.status,
        access_expires_at: session.accessExpiresAt,
        refresh_expires_at: session.refreshExpiresAt,
        last_active_at: new Date(),
      },
    })
  }

  async getSession(sid: string) {
    const session = await prisma.user_sessions.findUnique({ where: { session_id: sid } })
    if (!session) return null

    return {
      userId: session.user_id,
      sid: session.session_id,
      deviceFingerprint: session.device_fingerprint,
      accessJti: session.access_jti,
      refreshJti: session.refresh_jti,
      status: session.status as SessionStatus,
      accessExpiresAt: session.access_expires_at,
      refreshExpiresAt: session.refresh_expires_at,
    }
  }

  async resolveSidByRefreshJti(refreshJti: string) {
    const session = await prisma.user_sessions.findFirst({
      where: {
        refresh_jti: refreshJti,
        status: 'active',
        refresh_expires_at: { gt: new Date() },
      },
      select: { session_id: true },
    })

    return session?.session_id ?? null
  }

  async rotateJtis(sid: string, currentRefreshJti: string, next: {
    accessJti: string
    refreshJti: string
    accessExpiresAt: Date
    refreshExpiresAt: Date
  }) {
    const result = await prisma.user_sessions.updateMany({
      where: {
        session_id: sid,
        refresh_jti: currentRefreshJti,
        status: 'active',
        refresh_expires_at: { gt: new Date() },
      },
      data: {
        access_jti: next.accessJti,
        refresh_jti: next.refreshJti,
        access_expires_at: next.accessExpiresAt,
        refresh_expires_at: next.refreshExpiresAt,
        last_active_at: new Date(),
      },
    })

    return result.count === 1
  }

  async revokeSession(userId: bigint, sid: string) {
    await prisma.user_sessions.updateMany({
      where: { user_id: userId, session_id: sid, status: 'active' },
      data: { status: 'revoked', last_active_at: new Date() },
    })
  }

  async revokeAllSessions(userId: bigint) {
    await prisma.user_sessions.updateMany({
      where: { user_id: userId, status: 'active' },
      data: { status: 'revoked', last_active_at: new Date() },
    })
  }

  async validateAccess(input: { sid?: unknown; jti?: unknown; userId?: unknown }) {
    if (typeof input.sid !== 'string' || typeof input.jti !== 'string') return false
    if (typeof input.userId !== 'string') return false

    const session = await prisma.user_sessions.findFirst({
      where: {
        session_id: input.sid,
        user_id: BigInt(input.userId),
        access_jti: input.jti,
        status: 'active',
        access_expires_at: { gt: new Date() },
        refresh_expires_at: { gt: new Date() },
      },
      select: { id: true },
    })

    return Boolean(session)
  }
}

export const sessionService = new SessionService()
