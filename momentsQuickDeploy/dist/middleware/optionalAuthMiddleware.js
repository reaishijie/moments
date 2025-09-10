import jwt from 'jsonwebtoken';
export const optionalAuthMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const jwtSecret = process.env.JWT_SECRET;
        if (jwtSecret) {
            try {
                // 尝试验证 token
                const decodedPayload = jwt.verify(token, jwtSecret);
                req.user = decodedPayload; // 如果成功，附加 user
            }
            catch (error) {
                // 如果 token 无效，我们什么都不做，继续执行
                // req.user 将保持为 undefined
                console.warn('捕获到无效的Token，按游客处理');
            }
        }
    }
    // 无论有没有 token 或 token 是否有效，都放行
    next();
};
