import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export const logAction = {
    USER_REGISTER_SUCCESS: 'USER_REGISTER_SUCCESS',
    USER_REGISTER_FAILD: 'USER_REGISTER_FAILD',
    USER_LOGIN_SUCCESS: 'USER_LOGIN_SUCCESS',
    USER_LOGIN_FAILD: 'USER_LOGIN_FAILD',
    USER_UPDATE_PROFILE: 'USER_UPDATE_PROFILE',
    ARTICLE_CREATE: 'ARTICLE_CREATE',
    ARTICLE_UPDATE: 'ARTICLE_UPDATE',
    ARTICLE_DELETE: 'ARTICLE_DELETE',
    COMMENT_CREATE: 'COMMENT_CREATE',
    COMMENT_DELETE: 'COMMENT_DELETE',
    LIKE_CREATE: 'LIKE_CREATE',
    LIKE_DELETE: 'LIKE_DELETE'
    // 扩展日志行为
};
// 想写成链式调用，但是又不简洁，先写成这个样子吧
export const logger = {
    async add(data) {
        try {
            await prisma.logs.create({
                data: {
                    user_id: data.userId,
                    action: data.action,
                    target_type: data.targetType,
                    target_id: data.targetId,
                    status: data.status ?? 'SUCCESS',
                    details: data.details ?? undefined,
                    ip_address: data.ipAddress,
                    user_agent: data.userAgent,
                }
            });
        }
        catch (error) {
            console.error('日志写入失败', error);
        }
    }
};
