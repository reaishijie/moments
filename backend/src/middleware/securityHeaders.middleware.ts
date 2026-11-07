import type { NextFunction, Request, Response } from 'express'

/**
 * 轻量的补充安全响应头。
 *
 * 项目未引入 helmet，这里只设置对本站安全且有把握不会破坏现有功能的头：
 * - 不使用 CSP：站点包含后台可配置的 HTML 片段与内联样式，错误的 CSP 会直接白屏。
 * - COOP 使用 same-origin-allow-popups：OAuth 登录依赖 window.open 弹窗与 postMessage，
 *   若用 same-origin 会切断 opener 引用导致三方登录失败。
 */
export const securityHeaders = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
    res.setHeader('X-DNS-Prefetch-Control', 'off')
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

    if (req.secure) {
      res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains')
    }

    next()
  }
}
