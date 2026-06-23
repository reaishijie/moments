import { prisma } from "../lib/prisma.js";
import { Logger } from "../utils/logger.js";

const logger = new Logger('ConfigService')

export interface AppConfig {
    // 假设你的 key/value 都是字符串，如果不是，需要更复杂的类型定义
    [key: string]: string
}

export const CONFIG_CACHE: AppConfig = {}

let configCachePromise: Promise<AppConfig> | null = null

async function fetchConfigs(): Promise<AppConfig> {
    logger.log('正在从数据库加载配置信息...')
    try {
        const rawConfigs = await prisma.config.findMany()
        const configs = rawConfigs.reduce((acc, current) => {
            acc[current.k] = current.v
            return acc
        }, {} as Record<string, string>)

        Object.keys(CONFIG_CACHE).forEach(key => delete CONFIG_CACHE[key])
        Object.assign(CONFIG_CACHE, configs)

        logger.log('配置信息加载成功')
        return CONFIG_CACHE
    } catch (error) {
        logger.error('从数据库加载配置信息失败', error instanceof Error ? error.stack : String(error))
        throw new Error('Critical: Application failed to load configuration.');
    }
}

export function getConfigCache(): Promise<AppConfig> {
    configCachePromise ??= fetchConfigs()
    return configCachePromise
}

export async function refreshConfigCache(): Promise<AppConfig> {
    configCachePromise = fetchConfigs()
    return configCachePromise
}

