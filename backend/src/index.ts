import express from "express";
import location from "./routes/location";
import cors from 'cors'
import dotenv from "dotenv";
import authRouter from './routes/auth'
import userRouter from './routes/user'
import articlesRouter from './routes/articles'
import commentsRouter from './routes/comments'
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

app.listen(port, () => {
    console.log(`【${date}】🚀 后端启动成功：http://${host}:${port}`);
    
})