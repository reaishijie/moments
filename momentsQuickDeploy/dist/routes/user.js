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
// import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt';
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
        return res.status(200).json(responseUser);
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
        return res.status(200).json({ data: data });
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
        return res.status(500).json({ error: '服务器内部错误' });
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
        return res.status(200).json(responseData);
    }
    catch (error) {
        console.log('error:', error);
        return res.status(500).json({ error: '服务器错误' });
    }
}));
// 修改密码
router.patch('/password', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // 再次判断用户是否存在
    if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
        return res.status(401).json({ status: false, message: '请登录后操作' });
    }
    // 判断是否提供信息
    if (!req.body) {
        return res.status(400).json({ status: false, message: '请提供密码信息' });
    }
    const { oldPassword, newPassword } = req.body;
    // 判断是否提供新原密码
    if (!oldPassword || !newPassword) {
        return res.status(400).json({ status: false, message: '旧密码和新密码不能为空' });
    }
    // 判断新旧密码是否相同
    if (oldPassword === newPassword) {
        return res.status(400).json({ status: false, message: '旧密码和新密码不能相同' });
    }
    // 获取相应用户信息
    const user = yield prisma.users.findFirst({
        where: { id: BigInt(req.user.userId) },
    });
    if (!user) {
        return res.status(404).json({ status: false, message: '用户不存在' });
    }
    // 验证原密码是否与用户密码相同
    const isPasswordValid = yield bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({ status: false, message: '原密码错误' });
    }
    // hash新密码
    const hashedPassword = yield bcrypt.hash(newPassword, 10);
    // 进行数据更新
    yield prisma.users.update({
        where: { id: BigInt(req.user.userId) },
        data: { password: hashedPassword }
    });
    // 增加日志记录
    logger.add({
        userId: BigInt(req.user.userId),
        action: logAction.USER_UPDATE_PROFILE,
        targetType: 'users',
        targetId: BigInt(req.user.userId),
        details: { oldHashedPassword: user.password, newHashedPassword: hashedPassword },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
    });
    return res.status(200).json({ status: true, message: '密码修改成功' });
}));
export default router;
