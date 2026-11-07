import { Logger } from './logger.js'

const logger = new Logger('SecretGuard')

/** 仓库中出现过的占位密钥，任何情况下都不允许用于生产环境 */
const PLACEHOLDER_SECRETS = new Set([
  'demo_jwt_secret',
  'demo',
  'secret',
  'changeme',
  'change_me',
  'password',
  'your_secret',
  'jwt_secret',
])

const MIN_PRODUCTION_SECRET_LENGTH = 32

function isPlaceholder(value: string) {
  return PLACEHOLDER_SECRETS.has(value.trim().toLowerCase())
}

/**
 * 校验启动期密钥的安全性。
 *
 * - 生产环境：占位密钥或长度不足直接抛出，避免带着公开的默认密钥上线。
 * - 非生产环境：只打印警告，保证本地开发流程不被打断。
 */
export function assertSecureSecret(name: string, value: string | undefined, environment = process.env.NODE_ENV) {
  const isProduction = environment === 'production'

  if (!value || value.trim() === '') {
    throw new Error(`.env 文件中未定义 ${name}`)
  }

  const secret = value.trim()

  if (isPlaceholder(secret)) {
    const message = `${name} 使用了仓库中公开的占位值 "${secret}"，请替换为随机密钥（例如：openssl rand -hex 32）`
    if (isProduction) throw new Error(message)
    logger.warn(message)
    return
  }

  if (secret.length < MIN_PRODUCTION_SECRET_LENGTH) {
    const message = `${name} 长度不足 ${MIN_PRODUCTION_SECRET_LENGTH} 位，建议使用 openssl rand -hex 32 生成`
    if (isProduction) throw new Error(message)
    logger.warn(message)
  }
}
