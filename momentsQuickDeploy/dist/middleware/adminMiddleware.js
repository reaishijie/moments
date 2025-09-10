// 这个中间件必须在 authMiddleware 之后运行
export const adminMiddleware = (req, res, next) => {
    var _a;
    // 0为普通用户 | 1为管理员
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 1) {
        // 403 Forbidden - 已认证，但无权限
        return res.status(403).json({ error: '权限不足，仅限管理员操作' });
    }
    next();
};
