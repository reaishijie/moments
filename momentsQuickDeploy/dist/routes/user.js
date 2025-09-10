var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { logAction, logger } from "../services/log.service.js";
const router = Router();
const prisma = new PrismaClient();
// 获取用户信息
router.get('/', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: '无法从令牌中识别用户' });
        }
        const user = yield prisma.users.findUnique({
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
        });
        // 0未激活，1正常， 2封禁
        if (!user || user.status !== 1) {
            return res.status(404).json({ error: '用户未找到或未激活或已被封禁' });
        }
        // 再次转换 BigInt 以便返回
        const responseUser = Object.assign(Object.assign({}, user), { id: user.id.toString() });
        res.status(200).json(responseUser);
    }
    catch (error) {
        console.error('获取个人信息失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
}));
// 修改普通信息
router.patch('/', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // let userId: string | undefined 
    try {
        // 获取登录的用户id
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: '未授权' });
        }
        // 从请求体获取修改的内容
        const { nickname, brief, avatar, header_background, email } = req.body;
        const updateData = {};
        // 根据解构出的内容给 updateData对象 进行赋值
        if (nickname !== undefined)
            updateData.nickname = nickname;
        if (brief !== undefined)
            updateData.brief = brief;
        if (avatar !== undefined)
            updateData.avatar = avatar;
        if (header_background !== undefined)
            updateData.header_background = header_background;
        if (email !== undefined)
            updateData.email = email;
        // 如果为空直接返回
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: '没有提供任何需要更新的数据' });
        }
        // 更新数据
        const updateUser = yield prisma.users.update({
            where: {
                id: BigInt(userId)
            },
            data: updateData
        });
        // 返回除去密码的信息
        const { password } = updateUser, newUserInfo = __rest(updateUser, ["password"]);
        const data = Object.assign(Object.assign({}, newUserInfo), { 
            // id: newUserInfo.id.toString()
            id: Number(newUserInfo.id) });
        // 增加日志记录
        logger.add({
            userId: BigInt(userId),
            action: logAction.USER_UPDATE_PROFILE,
            targetType: 'users',
            targetId: BigInt(userId),
            details: data,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || '',
        });
        res.status(200).json({ data: data });
    }
    catch (error) {
        console.error('更新个人信息失败:', error);
        // 好像没必要记录
        // logger.add({
        //     userId: userId ? BigInt(userId): null,
        //     action: logAction.USER_UPDATE_PROFILE,
        //     targetType: 'users',
        //     targetId: userId ? BigInt(userId): null,
        //     status: 'FAILED',
        //     details: { error},
        //     ipAddress: req.ip,
        //     userAgent: req.headers['user-agent'] || '',
        // })
        res.status(500).json({ error: '服务器内部错误' });
    }
}));
// 根据用户名查询一些用户信息，主要id
router.get('/:username', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username } = req.params;
    try {
        const result = yield prisma.users.findUnique({
            where: {
                username: username
            },
            select: {
                id: true,
                nickname: true,
                avatar: true,
                header_background: true,
                brief: true
            }
        });
        if (!result) {
            return res.status(404).json({ message: '用户未找到' });
        }
        const responseData = Object.assign(Object.assign({}, result), { id: result === null || result === void 0 ? void 0 : result.id.toString() });
        res.status(200).json(responseData);
    }
    catch (error) {
        console.log('error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
}));
// 修改密码 ···待添加
export default router;
