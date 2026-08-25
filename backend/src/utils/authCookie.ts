import type { CookieOptions, Request, Response } from 'express'
import { REFRESH_TOKEN_TTL_SECONDS } from '../services/token.service.js'

export const REFRESH_TOKEN_COOKIE_NAME = 'moments_refresh_token'

function readBooleanEnv(name: string, fallback: boolean) {
  const value = process.env[name]?.trim().toLowerCase()
  if (value === 'true' || value === '1') return true
  if (value === 'false' || value === '0') return false
  return fallback
}

function readSameSite(): CookieOptions['sameSite'] {
  const value = process.env.AUTH_COOKIE_SAME_SITE?.trim().toLowerCase()
  if (value === 'strict' || value === 'none') return value
  return 'lax'
}

function refreshCookieOptions(req: Request): CookieOptions {
  const sameSite = readSameSite()
  const secure = sameSite === 'none'
    ? true
    : readBooleanEnv('AUTH_COOKIE_SECURE', req.secure || process.env.NODE_ENV === 'production')

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/api/auth',
    maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
  }
}

export function setRefreshTokenCookie(req: Request, res: Response, refreshToken: string) {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, refreshCookieOptions(req))
}

export function clearRefreshTokenCookie(req: Request, res: Response) {
  const { maxAge: _maxAge, ...options } = refreshCookieOptions(req)
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, options)
}

export function toPublicTokenResponse(tokens: {
  accessToken: string
  refreshToken: string
  expiresIn: number
}) {
  return {
    accessToken: tokens.accessToken,
    expiresIn: tokens.expiresIn,
  }
}
