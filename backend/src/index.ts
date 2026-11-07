import express from "express";
import location from "./routes/location.js";
import cors from 'cors'
import authRouter from './routes/auth.js'
import userRouter from './routes/user.js'
import articlesRouter from './routes/articles.js'
import commentsRouter from './routes/comments.js'
import noticeRouter from './routes/notice.js'
import noticesRouter from './routes/notices.js'
import adminRouter from './routes/admin.js'
import uploadRouter from './routes/upload.js'
import linkRouter from './routes/link.js'
import path from "path";
import { fileURLToPath } from "url";
import { disconnectPrisma } from "./lib/prisma.js";
import { Logger } from "./utils/logger.js";
import { customLogger } from "./middleware/httpLogger.middleware.js";
import { securityHeaders } from "./middleware/securityHeaders.middleware.js";
import { configureTrustProxy } from "./utils/trustProxy.js";
import cookieParser from 'cookie-parser'
import { isCorsOriginAllowed } from './utils/requestOrigin.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// 配置变量
const port = Number(process.env.PORT) || 9889
const listenHost = process.env.HOST || '0.0.0.0'
const appLogger = new Logger('APP')
const errorLogger = new Logger('ExceptionFilter')
const app = express()

// 默认不信任任何代理解析结果，反向代理部署需要通过 TRUST_PROXY 显式声明
configureTrustProxy(app)

//配置请求及路由
app.use(customLogger())
app.use(securityHeaders())
app.use(cors({
    origin(origin, callback) {
        if (!origin || isCorsOriginAllowed(origin)) return callback(null, true)
        return callback(null, false)
    },
    credentials: true,
}))
app.use(express.json())
app.use(cookieParser() as express.RequestHandler)
app.use(express.static(path.join(__dirname, '..',  'public'))); // 上级目录下的frontend

// 测试路由
app.get('/api', (req, res) => {
    res.status(200).json({
        status: 'success!',
        message: '后端接口已正常运行！'
    })
})

app.use('/api/location', location)
app.use('/api/auth', authRouter)
app.use('/api/user', userRouter);
app.use('/api/articles', articlesRouter)
app.use('/api/comments', commentsRouter)
app.use('/api/notice', noticeRouter)
app.use('/api/notices', noticesRouter)
app.use('/api/admin', adminRouter)
app.use('/api/upload', uploadRouter)
app.use('/api/link', linkRouter)

// 未匹配的接口统一返回 404，必须位于所有路由之后、错误处理之前
app.use('/api', (_req, res) => {
    res.status(404).json({ error: '接口不存在' })
})

// 前端单页应用兜底
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// 全局错误处理必须注册在最后，才能捕获上面所有路由与兜底逻辑抛出的异常
app.use(((err, _req, res, next) => {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const stack = err instanceof Error ? err.stack : undefined
    const type = (err as { type?: string })?.type

    errorLogger.error(`[SystemError] ${message}`, stack)

    // 响应已经开始时无法再改写状态码，交回 Express 默认处理
    if (res.headersSent) {
        return next(err)
    }

    // 客户端侧错误应返回 4xx，避免把请求体格式问题当成服务端故障
    if (type === 'entity.parse.failed') {
        return res.status(400).json({
            success: false,
            code: 400,
            message: '请求体不是合法的 JSON',
            data: null,
        })
    }

    if (type === 'entity.too.large') {
        return res.status(413).json({
            success: false,
            code: 413,
            message: '请求体过大',
            data: null,
        })
    }

    res.status(500).json({
        success: false,
        code: 500,
        message: '服务器内部错误',
        data: null,
    })
}) as express.ErrorRequestHandler)

app.listen(port, listenHost, () => {
    appLogger.log(`后端启动成功：http://${listenHost}:${port}`)

    process.on('SIGTERM', () => {
        appLogger.warn('SIGTERM received, closing resources...');
        disconnectPrisma();
        process.exit(0);
    })
})
