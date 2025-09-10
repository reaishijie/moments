import jwt from 'jsonwebtoken';
export const authMiddleware = (req, res, next) => {
    // 获取token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return res.status(401).json({ error: '未提供认证令牌或认证令牌格式错误' });
    }
    // 从authHeader中取出token
    const token = authHeader.split(' ')[1];
    // 验证token
    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('.env 文件中未定义 JWT_SECRET');
        }
        // jwt.verify 验证 token 并解码
        const decodedPayload = jwt.verify(token, jwtSecret);
        // 将解码后的用户信息附加到请求对象上
        req.user = decodedPayload;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: '无效或已过期的令牌' });
    }
};
