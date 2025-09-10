var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    add(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                yield prisma.logs.create({
                    data: {
                        user_id: data.userId,
                        action: data.action,
                        target_type: data.targetType,
                        target_id: data.targetId,
                        status: (_a = data.status) !== null && _a !== void 0 ? _a : 'SUCCESS',
                        details: (_b = data.details) !== null && _b !== void 0 ? _b : undefined,
                        ip_address: data.ipAddress,
                        user_agent: data.userAgent,
                    }
                });
            }
            catch (error) {
                console.error('日志写入失败', error);
            }
        });
    }
};
