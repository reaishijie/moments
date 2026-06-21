// 这个中间件必须在 authMiddleware 之后运行
export const adminMiddleware = (req, res, next) => {
    // 0为普通用户 | 1为管理员
    if (req.user?.role !== 1) {
        // 403 Forbidden - 已认证，但无权限
        return res.status(403).json({ error: '权限不足，仅限管理员操作' });
    }
    next();
};
