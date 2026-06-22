import express from "express";
import location from "./routes/location.js";
import cors from 'cors'
import dotenv from "dotenv";
import authRouter from './routes/auth.js'
import userRouter from './routes/user.js'
import articlesRouter from './routes/articles.js'
import commentsRouter from './routes/comments.js'
import noticeRouter from './routes/notice.js'
import adminRouter from './routes/admin.js'
import uploadRouter from './routes/upload.js'
import linkRouter from './routes/link.js'
import path from "path";
import { fileURLToPath } from "url";
import { CONFIG_CACHE } from "./services/config.service.js";
import { disconnectPrisma } from "./lib/prisma.js";
import { Logger } from "./utils/logger.js";
import { customLogger } from "./middleware/httpLogger.middleware.js";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// 载入env配置
dotenv.config()

// 配置变量
const port = Number(process.env.PORT) || 9889
const listenHost = process.env.HOST || '0.0.0.0'
const appLogger = new Logger('APP')
const errorLogger = new Logger('ExceptionFilter')
const app = express()
app.set('trust proxy', true)
//配置请求及路由
app.use(customLogger())
app.use(cors())
app.use(express.json())
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
app.use('/api/admin', adminRouter)
app.use('/api/upload', uploadRouter)
app.use('/api/link', linkRouter)

app.use(((err, _req, res, _next) => {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const stack = err instanceof Error ? err.stack : undefined

    errorLogger.error(`[SystemError] ${message}`, stack)

    res.status(500).json({
        success: false,
        code: 500,
        message: '服务器内部错误',
        data: null,
    })
}) as express.ErrorRequestHandler)

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});
app.listen(port, listenHost, () => {
    appLogger.log(`后端启动成功：http://${listenHost}:${port}`);

    process.on('SIGTERM', () => {
        appLogger.warn('SIGTERM received, closing resources...');
        disconnectPrisma();
        process.exit(0);
    });
})