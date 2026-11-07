import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'
import { assertSecureSecret } from '../utils/secret.js'

const JWT_ALGORITHM = 'HS256' as const

export type TokenType = 'access' | 'refresh'

export type AuthTokenPayload = {
  sub: string
  scope: string
  tokenType: TokenType
  sid: string
  jti: string
  deviceId?: string
  iat?: number
  exp?: number
}

function readPositiveIntEnv(name: string, fallback: number) {
  const value = Number(process.env[name])
  return Number.isFinite(value) && value > 0 ? value : fallback
}

export const ACCESS_TOKEN_TTL_SECONDS = readPositiveIntEnv('JWT_ACCESS_EXPIRES_SECONDS', 2 * 60 * 60)
export const REFRESH_TOKEN_TTL_SECONDS = readPositiveIntEnv('JWT_REFRESH_EXPIRES_SECONDS', 30 * 24 * 60 * 60)
export const AUTH_TOKEN_SCOPE = process.env.JWT_SCOPE || 'user'

export class TokenService {
  private readonly secret: string

  constructor(
    secret = process.env.JWT_SECRET,
    private readonly scope = AUTH_TOKEN_SCOPE,
    private readonly accessTtlSeconds = ACCESS_TOKEN_TTL_SECONDS,
    private readonly refreshTtlSeconds = REFRESH_TOKEN_TTL_SECONDS,
  ) {
    assertSecureSecret('JWT_SECRET', secret)
    this.secret = (secret as string).trim()
  }

  signToken(input: {
    userId: string | number | bigint
    tokenType: TokenType
    sid: string
    jti: string
    deviceId?: string
  }) {
    const now = Math.floor(Date.now() / 1000)
    const ttl = input.tokenType === 'access' ? this.accessTtlSeconds : this.refreshTtlSeconds

    return jwt.sign(
      {
        sub: input.userId.toString(),
        scope: this.scope,
        tokenType: input.tokenType,
        sid: input.sid,
        jti: input.jti,
        deviceId: input.deviceId,
        iat: now,
        exp: now + ttl,
      },
      this.secret,
      { algorithm: JWT_ALGORITHM },
    )
  }

  verify(token: string) {
    // 显式固定算法，避免算法混淆类攻击
    return jwt.verify(token, this.secret, { algorithms: [JWT_ALGORITHM] }) as AuthTokenPayload
  }

  createJti() {
    return randomUUID()
  }
}

export const tokenService = new TokenService()
