import type { Application } from 'express'
import { Logger } from './logger.js'

const logger = new Logger('TrustProxy')

const PRESETS = new Set(['loopback', 'linklocal', 'uniquelocal'])

/**
 * 解析 TRUST_PROXY 配置。
 *
 * 默认不信任任何反向代理（返回 false），因为 `trust proxy = true` 会让攻击者
 * 通过伪造 X-Forwarded-For 随意篡改 `req.ip`，而 `req.ip` 是限流与人机验证的判据。
 * 部署在反向代理后面时，必须在环境变量中显式声明可信跳数。
 */
export function resolveTrustProxy(value = process.env.TRUST_PROXY): boolean | number | string {
  const raw = value?.trim()

  if (!raw) return false

  if (raw === 'true') {
    logger.warn('TRUST_PROXY=true 会信任任意 X-Forwarded-For，仅在完全可控的内网环境使用')
    return true
  }

  if (raw === 'false') return false

  if (/^\d+$/.test(raw)) {
    return Number.parseInt(raw, 10)
  }

  if (PRESETS.has(raw)) {
    return raw
  }

  logger.warn(`无法识别的 TRUST_PROXY 配置 "${raw}"，已按不信任代理处理`)
  return false
}

export function configureTrustProxy(app: Application) {
  const trustProxy = resolveTrustProxy()
  app.set('trust proxy', trustProxy)
  return trustProxy
}
