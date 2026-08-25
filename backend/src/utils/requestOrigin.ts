import type { Request } from 'express'

function configuredOrigins() {
  const origins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)

  if (process.env.NODE_ENV !== 'production') {
    origins.push('http://localhost:5173', 'http://127.0.0.1:5173')
  }

  return new Set(origins)
}

const allowedOrigins = configuredOrigins()

export function isCorsOriginAllowed(origin: string) {
  return allowedOrigins.has(origin)
}

export function isRequestOriginTrusted(req: Request) {
  const origin = req.get('origin')
  if (!origin) return true

  const requestOrigin = `${req.protocol}://${req.get('host')}`
  return origin === requestOrigin || allowedOrigins.has(origin)
}
