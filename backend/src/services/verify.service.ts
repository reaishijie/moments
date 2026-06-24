import axios from "axios"
import { prisma } from "../lib/prisma.js"
import { Logger } from "../utils/logger.js"

const logger = new Logger('VerifyService')

export const verifyHcaptcha = async (captchaToke: string) => {
    try {
        // 获取hcaptcha的用户密钥
        const userKey = await prisma.config.findFirst({
            where: {
                k: 'verify_hcaptcha_user'
            },
            select: {
                v: true
            }
        })
        // 进行验证请求
        const HCAPTCHA_SECRET_KEY = userKey?.v
        const result = await axios.post(
            'https://hcaptcha.com/siteverify',
            `secret=${HCAPTCHA_SECRET_KEY}&response=${captchaToke}`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        )
        logger.debug(`hCaptcha 验证结果：${result.data.success}`)
        return result.data.success
    } catch (error) {
        logger.error('hCaptcha 验证失败', error instanceof Error ? error.stack : String(error))
        return false;
    }
}