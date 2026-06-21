import { prisma } from "../lib/prisma.js";

interface AppConfig {
    // 假设你的 key/value 都是字符串，如果不是，需要更复杂的类型定义
    [key: string]: string
}
async function fetchConfigs(): Promise<AppConfig> {
    console.log("--- ✨ 正在从数据库加载配置信息... ---");
    try {
        const rawConfigs = await prisma.config.findMany()
        const configs = rawConfigs.reduce((acc, current) => {
            acc[current.k] = current.v
            return acc
        }, {} as Record<string, string>)
        console.log("--- ✨ 信息加载成功... ---");
        return configs
    } catch (error) {
        console.error('从数据库加载配置信息失败', error)
        throw new Error('Critical: Application failed to load configuration.');
    }
}
export const CONFIG_CACHE: AppConfig = await fetchConfigs();

