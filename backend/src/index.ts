import express from "express";
import location from "./routes/location.js";
import cors from 'cors'
import dotenv from "dotenv";
import authRouter from './routes/auth.js'
import userRouter from './routes/user.js'
import articlesRouter from './routes/articles.js'
import commentsRouter from './routes/comments.js'
import noticeRouter from './routes/notice.js'
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// 载入env配置
dotenv.config()

// 配置变量
const date = new Date().toLocaleString()
const port = process.env.PORT || 9889
const host = process.env.DB_HOST || '127.0.0.1'
const app = express()
//配置请求及路由
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
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.listen(port, () => {
    console.log(`【${date}】🚀 后端启动成功：http://${host}:${port}`);
    
})