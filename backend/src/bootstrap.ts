import dotenv from 'dotenv'

// 先加载环境变量，再动态导入应用入口，避免 ESM 静态 import 提前执行业务模块。
dotenv.config()

await import('./index.js')
