import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function fetchConfigs() {
    console.log("--- ✨ 正在从数据库加载配置信息... ---");
    try {
        const rawConfigs = await prisma.config.findMany();
        const configs = rawConfigs.reduce((acc, current) => {
            acc[current.k] = current.v;
            return acc;
        }, {});
        console.log("--- ✨ 信息加载成功... ---");
        return configs;
    }
    catch (error) {
        console.error('从数据库加载配置信息失败', error);
        throw new Error('Critical: Application failed to load configuration.');
    }
    finally {
        prisma.$disconnect();
    }
}
export const CONFIG_CACHE = await fetchConfigs();
export function disconnectPrisma() {
    prisma.$disconnect();
}
