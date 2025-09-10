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
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { logAction, logger } from "../services/log.service.js";
const router = Router();
const prisma = new PrismaClient();
// 注册
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password: rawPassword, email } = req.body;
        // 验证输入
        if (!username || !rawPassword) {
            return res.status(400).json({ error: '用户名、密码不能为空' });
        }
        // 检查用户是否已存在
        const existingUser = yield prisma.users.findFirst({
            where: {
                OR: [
                    { username: username },
                    { email: email }
                ]
            }
        });
        if (existingUser) {
            return res.status(409).json({ error: '用户名或邮箱已被注册' });
        }
        // 哈希密码
        const hashedPassword = yield bcrypt.hash(rawPassword, 10);
        // 创建新用户
        const newUser = yield prisma.users.create({
            data: {
                username: username,
                password: hashedPassword,
                email: email
            }
        });
        // 将新用户信息除去密码后返回
        const { password } = newUser, userInfo = __rest(newUser, ["password"]);
        const responseUser = Object.assign(Object.assign({}, userInfo), { 
            // 因为id是BigInt类型
            // id: userInfo.id.toString()
            id: Number(userInfo.id) });
        logger.add({
            userId: BigInt(responseUser.id),
            action: logAction.USER_REGISTER_SUCCESS,
            targetType: 'users',
            targetId: BigInt(responseUser.id),
            details: responseUser,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || '',
        });
        return res.status(201).json(responseUser);
    }
    catch (error) {
        console.log('注册失败', error);
        res.status(500).json({ error: '服务器内部错误！' });
    }
}));
// 登录
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { identifier, password } = req.body;
        // 验证输入
        if (!identifier || !password) {
            return res.status(400).json({ error: '请输入信息' });
        }
        // 查找用户信息
        const user = yield prisma.users.findFirst({
            where: {
                OR: [
                    { username: identifier },
                    { email: identifier }
                ]
            }
        });
        if (!user) {
            logger.add({
                userId: null,
                action: logAction.USER_LOGIN_FAILD,
                targetType: 'users',
                targetId: null,
                status: 'FAILED',
                details: { error: '账号或密码错误' },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'] || '',
            });
            return res.status(401).json({ error: '账号或密码错误' });
        }
        // 验证密码
        const isPasswordValid = yield bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            logger.add({
                userId: BigInt(user.id),
                action: logAction.USER_LOGIN_FAILD,
                targetType: 'users',
                targetId: BigInt(user.id),
                status: 'FAILED',
                details: { error: '邮箱或密码错误' },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'] || '',
            });
            return res.status(401).json({ error: '邮箱或密码错误' });
        }
        // 检查用户状态是否正常 0未激活， 1正常， 2封禁
        if (user.status !== 1) {
            logger.add({
                userId: BigInt(user.id),
                action: logAction.USER_LOGIN_FAILD,
                targetType: 'users',
                targetId: BigInt(user.id),
                status: 'FAILED',
                details: { error: '用户状态异常，无法登录' },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'] || '',
            });
            return res.status(403).json({ error: '用户状态异常，无法登录' }); // 403 Forbidden
        }
        // 生成令牌
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('.env 文件中未定义 JWT_SECRET');
        }
        const token = jwt.sign({
            //user.id也是BigInt，需要转字符串处理一下
            userId: user.id.toString(),
            username: user.username,
            role: user.role
        }, jwtSecret, { expiresIn: '7d' });
        logger.add({
            userId: BigInt(user.id),
            action: logAction.USER_LOGIN_SUCCESS,
            targetType: 'users',
            targetId: BigInt(user.id),
            details: { token: token, userinfo: user },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || '',
        });
        // 返回token令牌
        res.status(200).json({ token });
    }
    catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
}));
export default router;
