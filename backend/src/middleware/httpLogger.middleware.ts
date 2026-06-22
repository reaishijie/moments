import type { NextFunction, Request, Response } from 'express'
import { Logger } from '../utils/logger.js'

const httpLogger = new Logger('HTTP')

export const customLogger = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now()

    res.on('finish', () => {
      const ms = Date.now() - start
      const path = req.originalUrl || req.url
      const status = res.statusCode
      const message = `${req.method} ${path} ${status} - ${ms}ms`

      if (status >= 500) {
        httpLogger.error(message)
      } else if (status >= 400) {
        httpLogger.warn(message)
      } else {
        httpLogger.log(message)
      }
    })

    next()
  }
}
