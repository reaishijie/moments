import express from "express";
import location from "./routes/location";
import cors from 'cors'
import dotenv from "dotenv";
import authRouter from './routes/auth'
import userRouter from './routes/user'
import articlesRouter from './routes/articles'
// 载入env配置
dotenv.config()

// 配置变量
const date = new Date().toLocaleString()
const port = process.env.PORT || 9889
const app = express()
//配置请求及路由
app.use(cors())
app.use(express.json())
// 测试路由
app.get('/', (req, res) => {
    res.status(200).json({
        "status": "success!!!"
    })
})

app.use('/api', location)
app.use('/api/auth', authRouter)
app.use('/api', userRouter);
app.use('/api/articles', articlesRouter)

app.listen(port, () => {
    console.log(`【${date}】🚀 后端启动成功：http://localhost:${port}`);
    
})