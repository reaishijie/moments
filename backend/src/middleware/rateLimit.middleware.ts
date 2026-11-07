import type { NextFunction, Request, Response } from 'express'
import { Logger } from '../utils/logger.js'

const logger = new Logger('RateLimit')

export interface RateLimitOptions {
  /** 统计窗口长度（毫秒） */
  windowMs: number
  /** 窗口内允许的最大请求次数 */
  max: number
  /** 限流键前缀，用于区分同一个 IP 在不同接口上的配额 */
  bucket: string
  /** 命中限流时的提示信息 */
  message?: string
  /** 自定义限流键，默认按客户端 IP 统计 */
  keyGenerator?: (req: Request) => string | null
  /** 只统计失败的请求（状态码 >= 400），避免正常用户被误伤 */
  skipSuccessfulRequests?: boolean
}

interface RateLimitRecord {
  count: number
  resetAt: number
}

/** 防止恶意构造大量不同 key 撑爆内存 */
const MAX_KEYS = 10_000
/** 惰性清理间隔 */
const SWEEP_INTERVAL_MS = 60_000

const stores = new Map<string, Map<string, RateLimitRecord>>()

function getStore(bucket: string) {
  let store = stores.get(bucket)
  if (!store) {
    store = new Map()
    stores.set(bucket, store)
  }
  return store
}

function sweep(store: Map<string, RateLimitRecord>, now: number) {
  for (const [key, record] of store) {
    if (record.resetAt <= now) store.delete(key)
  }
}

function enforceCapacity(store: Map<string, RateLimitRecord>) {
  if (store.size <= MAX_KEYS) return

  // Map 按插入顺序迭代，超限时淘汰最早写入的记录
  const overflow = store.size - MAX_KEYS
  let removed = 0
  for (const key of store.keys()) {
    store.delete(key)
    removed += 1
    if (removed >= overflow) break
  }
}

function resolveClientKey(req: Request) {
  // req.ip 依赖 trust proxy 配置；未配置可信代理时即为直连地址
  return req.ip || req.socket.remoteAddress || 'unknown'
}

/**
 * 进程内固定窗口限流。
 *
 * 说明：这是单实例方案，与项目现有的 captchaProof 缓存保持一致；如需多实例部署，
 * 需要把计数迁到 Redis 这类共享存储。
 */
export const rateLimit = (options: RateLimitOptions) => {
  const {
    windowMs,
    max,
    bucket,
    message = '请求过于频繁，请稍后再试',
    keyGenerator = resolveClientKey,
    skipSuccessfulRequests = false,
  } = options
  const store = getStore(bucket)

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now()

    if (store.size > MAX_KEYS) {
      sweep(store, now)
      enforceCapacity(store)
    }

    const key = keyGenerator(req)
    // 无法生成限流键时直接放行，避免因为 key 缺失导致全部请求被合并限流
    if (!key) {
      return next()
    }

    let record = store.get(key)

    if (!record || record.resetAt <= now) {
      record = { count: 0, resetAt: now + windowMs }
      store.set(key, record)
    }

    record.count += 1

    const remaining = Math.max(0, max - record.count)
    res.setHeader('RateLimit-Limit', String(max))
    res.setHeader('RateLimit-Remaining', String(remaining))
    res.setHeader('RateLimit-Reset', String(Math.ceil((record.resetAt - now) / 1000)))

    if (record.count > max) {
      const retryAfter = Math.max(1, Math.ceil((record.resetAt - now) / 1000))
      res.setHeader('Retry-After', String(retryAfter))
      logger.warn(`限流命中 bucket=${bucket} key=${key} count=${record.count}/${max}`)
      return res.status(429).json({ error: message })
    }

    if (skipSuccessfulRequests) {
      res.on('finish', () => {
        if (res.statusCode < 400) {
          const current = store.get(key)
          if (current) {
            current.count = Math.max(0, current.count - 1)
          }
        }
      })
    }

    next()
  }
}

/** 仅供测试或进程退出时清理内存 */
export function resetRateLimitStores() {
  stores.clear()
}
