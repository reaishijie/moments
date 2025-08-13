import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log(`开始网站创建管理员...`);
  const adminUsername = 'admin';
  const email = '2900383833@qq.com'
  const existingAdmin = await prisma.users.findUnique({ where: { username: adminUsername } });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('123456', 10)
    await prisma.users.create({
      data: {
        username: adminUsername,
        email: email,
        password: hashedPassword,
        status: 1, // 正常
        role: 1,   // 管理员
        nickname: '超级管理员',
      },
    });
    console.log(`✅ 管理员用户 "${adminUsername}" 已创建.`);
  } else {
    console.log(`ℹ️ 管理员用户 "${adminUsername}" 已存在，跳过创建.`);
  }
  console.log(`数据填充完成.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });