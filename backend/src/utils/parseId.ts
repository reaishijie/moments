/**
 * 把来自客户端（params / query / body）的值安全地转换成 bigint。
 *
 * 直接使用 `BigInt(value)` 时，非法输入会抛出 `SyntaxError`，最终被全局错误处理
 * 兜底成 500。这里统一返回 `null`，让路由层可以明确响应 400。
 */
export function toBigInt(value: unknown): bigint | null {
  if (typeof value === 'bigint') {
    return value >= 0n ? value : null
  }

  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value >= 0 ? BigInt(value) : null
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return /^\d+$/.test(trimmed) ? BigInt(trimmed) : null
  }

  return null
}

/**
 * 与 `toBigInt` 相同，但允许空值（未提供该参数）。
 * 用于可选参数，例如评论的 parentId。
 */
export function toOptionalBigInt(value: unknown): bigint | null {
  if (value === undefined || value === null || value === '') {
    return null
  }

  return toBigInt(value)
}
