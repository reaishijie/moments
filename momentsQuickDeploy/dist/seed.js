var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`开始网站创建管理员...`);
        const adminUsername = 'admin';
        const email = '2900383833@qq.com';
        const existingAdmin = yield prisma.users.findUnique({ where: { username: adminUsername } });
        if (!existingAdmin) {
            const hashedPassword = yield bcrypt.hash('123456', 10);
            yield prisma.users.create({
                data: {
                    username: adminUsername,
                    email: email,
                    password: hashedPassword,
                    status: 1, // 正常
                    role: 1, // 管理员
                    nickname: '超级管理员',
                },
            });
            console.log(`✅ 管理员用户 "${adminUsername}" 已创建.`);
        }
        else {
            console.log(`ℹ️ 管理员用户 "${adminUsername}" 已存在，跳过创建.`);
        }
        console.log(`数据填充完成.`);
    });
}
main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => __awaiter(void 0, void 0, void 0, function* () { yield prisma.$disconnect(); }));
