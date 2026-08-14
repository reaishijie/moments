import { randomBytes } from 'node:crypto'
import axios from 'axios'
import { prisma } from '../lib/prisma.js'
import { Logger } from '../utils/logger.js'

const logger = new Logger('VerifyService')
const CAPTCHA_PROOF_TTL_MS = 5 * 60 * 1000

export type CaptchaProvider = 'hcaptcha' | 'turnstile'

type CaptchaProofRecord = {
  expiresAt: number
  remoteIp?: string
}

const captchaProofs = new Map<string, CaptchaProofRecord>()

const PROVIDER_CONFIG = {
  hcaptcha: {
    name: 'hCaptcha',
    secretKey: 'verify_hcaptcha_user',
    verifyUrl: 'https://hcaptcha.com/siteverify',
  },
  turnstile: {
    name: 'Cloudflare Turnstile',
    secretKey: 'verify_turnstile_secret',
    verifyUrl: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
  },
} as const

async function getConfigValues(keys: string[]) {
  const configs = await prisma.config.findMany({
    where: { k: { in: keys } },
    select: { k: true, v: true },
  })

  return configs.reduce<Record<string, string>>((values, config) => {
    values[config.k] = config.v
    return values
  }, {})
}

async function verifyWithProvider(token: string, provider: CaptchaProvider, remoteIp?: string) {
  const providerConfig = PROVIDER_CONFIG[provider]

  try {
    const configs = await getConfigValues([providerConfig.secretKey])
    const secret = configs[providerConfig.secretKey]?.trim()
    if (!secret) {
      logger.warn(`${providerConfig.name} 服务端密钥未配置`)
      return false
    }

    const body = new URLSearchParams({ secret, response: token })
    if (remoteIp) body.set('remoteip', remoteIp)

    const result = await axios.post<{ success?: boolean }>(providerConfig.verifyUrl, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    const success = result.data.success === true
    logger.debug(`${providerConfig.name} 验证结果：${success}`)
    return success
  } catch (error) {
    logger.error(`${providerConfig.name} 验证失败`, error instanceof Error ? error.stack : String(error))
    return false
  }
}

function cleanupExpiredProofs() {
  const now = Date.now()
  for (const [proof, record] of captchaProofs.entries()) {
    if (record.expiresAt <= now) captchaProofs.delete(proof)
  }
}

export function issueCaptchaProof(remoteIp?: string) {
  cleanupExpiredProofs()
  const proof = randomBytes(32).toString('base64url')
  captchaProofs.set(proof, {
    expiresAt: Date.now() + CAPTCHA_PROOF_TTL_MS,
    remoteIp,
  })
  return proof
}

function consumeCaptchaProof(proof: unknown, remoteIp?: string) {
  if (typeof proof !== 'string' || !proof) return false

  cleanupExpiredProofs()
  const record = captchaProofs.get(proof)
  if (!record) return false

  captchaProofs.delete(proof)
  return !record.remoteIp || !remoteIp || record.remoteIp === remoteIp
}

export async function verifyCaptchaProofForAction(configKey: string, proof: unknown, remoteIp?: string) {
  const configs = await getConfigValues([configKey])
  if (configs[configKey] !== '1') return true
  return consumeCaptchaProof(proof, remoteIp)
}

export async function getCaptchaProvider(): Promise<CaptchaProvider> {
  const configs = await getConfigValues(['captcha_provider'])
  return configs.captcha_provider === 'turnstile' ? 'turnstile' : 'hcaptcha'
}

export async function verifyCaptcha(token: string, remoteIp?: string) {
  const provider = await getCaptchaProvider()
  return verifyWithProvider(token, provider, remoteIp)
}

export function verifyHcaptcha(token: string, remoteIp?: string) {
  return verifyWithProvider(token, 'hcaptcha', remoteIp)
}
