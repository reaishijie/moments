import { Router } from 'express'
import writeRoutes from './articles/write.routes.js'
import listRoutes from './articles/list.routes.js'
import likeRoutes from './articles/like.routes.js'

/**
 * 文章相关路由的组合入口。
 *
 * 具体实现在 ./articles/ 下按读、写、点赞三组拆分：
 * - write.routes.ts：创建 / 更新 / 删除
 * - list.routes.ts：列表 / 详情 / 文章评论列表
 * - like.routes.ts：点赞 / 取消点赞 / 点赞用户列表
 *
 * 挂载顺序保持拆分前的声明顺序，避免 Express 的路径匹配行为发生变化。
 */
const router = Router()

router.use(writeRoutes)
router.use(listRoutes)
router.use(likeRoutes)

export default router
