var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios from "axios";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export const verifyHcaptcha = (captchaToke) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 获取hcaptcha的用户密钥
        const userKey = yield prisma.config.findFirst({
            where: {
                k: 'verify_hcaptcha_user'
            },
            select: {
                v: true
            }
        });
        // 进行验证请求
        const HCAPTCHA_SECRET_KEY = userKey === null || userKey === void 0 ? void 0 : userKey.v;
        const result = yield axios.post('https://hcaptcha.com/siteverify', `secret=${HCAPTCHA_SECRET_KEY}&response=${captchaToke}`, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        console.log(result.data);
        return result.data.success;
    }
    catch (error) {
        console.error('hCaptcha 验证失败：', error);
        return false;
    }
});
