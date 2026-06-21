import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { logAction, logger } from "../services/log.service.js";
const router = Router();
const prisma = new PrismaClient();
// 注册
router.post('/register', async (req, res) => {
    try {
        const { username, password: rawPassword, email, status } = req.body;
        console.log('@register', req.body);
        // 验证输入
        if (!username || !rawPassword) {
            return res.status(400).json({ error: '用户名、密码不能为空' });
        }
        // 检查用户是否已存在
        const existingUser = await prisma.users.findFirst({
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
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        // 创建新用户
        const newUser = await prisma.users.create({
            data: {
                username: username,
                password: hashedPassword,
                email: email,
                status: status || 0, //默认注册后 0为未激活 | 1为正常用户 | 2为封禁
            }
        });
        // 将新用户信息除去密码后返回
        const { password, ...userInfo } = newUser;
        const responseUser = {
            ...userInfo,
            // 因为id是BigInt类型
            // id: userInfo.id.toString()
            id: Number(userInfo.id)
        };
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
});
// 登录
router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        // 验证输入
        if (!identifier || !password) {
            return res.status(400).json({ error: '请输入信息' });
        }
        // 查找用户信息
        const user = await prisma.users.findFirst({
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
        const isPasswordValid = await bcrypt.compare(password, user.password);
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
});
export default router;
