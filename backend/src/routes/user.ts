import { Router, Request, Response } from "express"
import { PrismaClient } from "@prisma/client"
import { authMiddleware } from "../middleware/authMiddleware"
import { log } from "console"

const router = Router()
const prisma = new PrismaClient()

// 获取用户信息
router.get('/user', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId
        if (!userId) {
            return res.status(401).json({ error: '无法从令牌中识别用户' })
        }
        const user = await prisma.users.findUnique({
            where: {
                // 将字符串id转换为 BigInt 以便查询
                id: BigInt(userId)
            },
            select: {
                id: true,
                username: true,
                email: true,
                nickname: true,
                brief: true,
                role: true,
                status: true,
                avatar: true,
                header_background: true,
                created_at: true
            }
        })
        // 0未激活，1正常， 2封禁
        if (!user || user.status !==1) {
            return res.status(404).json({ error: '用户未找到或未激活或已被封禁' });
        }

        // 再次转换 BigInt 以便返回
        const responseUser = {
            ...user,
            id: user.id.toString(),
        };

        res.status(200).json(responseUser);

    } catch(error) {
        console.error('获取个人信息失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
})


// 修改普通信息
router.patch('/user', authMiddleware, async(req: Request, res: Response) => {
    try {
        // 获取登录的用户id
        const userId = req.user?.userId
        if (!userId) {
            return res.status(401).json({ error: '未授权' })
        }
        // 从请求体获取修改的内容
        const { nickname, brief, avatar, header_background } = req.body
        console.log('!!!',req.body);
        
        const updateData: {
            nickname? :string,
            brief?: string,
            avatar?: string,
            header_background?: string;
        } = {}
        // 根据解构出的内容给 updateData对象 进行复制
        if (nickname !== undefined) updateData.nickname = nickname;
        if (brief !== undefined) updateData.brief = brief;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (header_background !== undefined) updateData.header_background = header_background;
        // 如果为空直接返回
        if(Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: '没有提供任何需要更新的数据' })
        }
        // 更新数据
        const updateUser = await prisma.users.update({
            where: {
                id: BigInt(userId)
            },
            data: updateData
        })
        
        // 返回除去密码的信息
        const { password, ...newUserInfo } = updateUser
        const data = {
            ...newUserInfo,
            // id: newUserInfo.id.toString()
            id: Number(newUserInfo.id)
        }
        res.status(200).json({data: data })
    } catch (error) {
        console.error('更新个人信息失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
})

// 修改密码 ···待添加

export default router