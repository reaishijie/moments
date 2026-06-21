import axios from "axios";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export const verifyHcaptcha = async (captchaToke) => {
    try {
        // 获取hcaptcha的用户密钥
        const userKey = await prisma.config.findFirst({
            where: {
                k: 'verify_hcaptcha_user'
            },
            select: {
                v: true
            }
        });
        // 进行验证请求
        const HCAPTCHA_SECRET_KEY = userKey?.v;
        const result = await axios.post('https://hcaptcha.com/siteverify', `secret=${HCAPTCHA_SECRET_KEY}&response=${captchaToke}`, {
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
};
