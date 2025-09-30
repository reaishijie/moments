import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log(`⚡ 开始网站创建管理员...`);
  const adminUsername = 'admin';
  const email = '2900383833@qq.com'
  const password = '123456'
  const existingAdmin = await prisma.users.findUnique({ where: { username: adminUsername } });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(password, 10)
    await prisma.users.create({
      data: {
        username: adminUsername,
        email: email,
        password: hashedPassword,
        status: 1, // 正常
        role: 1,   // 管理员
        nickname: '超级管理员',
        avatar: '/img/avatar.jpg'
      },
    });
    console.log(`✅ 管理员用户 "${adminUsername}" 已创建.`);
  } else {
    console.log(`ℹ️ 管理员用户 "${adminUsername}" 已存在，跳过创建.`);
  }

  console.log('⚡ 开始创建网站信息...');
  const configs = [
    // 网站信息
    {
      k: 'sitename',
      v: '瞬刻'
    },
    {
      k: 'site_url',
      v: ''
    },
    {
      k: 'site_email',
      v: ''
    },
    {
      k: 'site_keywords',
      v: '瞬刻,微信朋友圈,记录瞬间,博客程序,内容发布,博客'
    },
    {
      k: 'site_description',
      v: '瞬刻是一个现代化的社交媒体应用，专注于为用户提供简洁、流畅的内容分享体验。项目采用前后端分离架构，支持文字、图片、视频等多种内容类型的发布和交互。'
    },
    // 网站背景图
    {
      k: 'site_background',
      v: '/img/background.avif'
    },
    // 网站LOGO
    {
      k: 'site_logo',
      v: ''
    },
    // 首页用户背景
    {
      k: 'site_header_background',
      v: ''
    },
    {
      k: 'site_avatar',
      v: '/img/avatar.jpg'
    },
    {
      k: 'site_brief',
      v: ''
    },
    // 发件邮箱
    {
      k: 'mail_host',
      v: 'smtp.qq.com'
    },
    {
      k: 'mail_port',
      v: '465'
    },
    {
      k: 'mail_secure',
      v: 'true'
    },
    {
      k: 'mail_user',
      v: ''
    },
    {
      k: 'mail_pass',
      v: ''
    },
    {
      k: 'user_auth',
      v: '0'
    },
    {
      k: 'user_captcha',
      v: '0'
    },
    {
      k: 'user_status',
      v: '1'
    },
    {
      k: 'verify_hcaptcha_user',
      v: ''
    },
    {
      k: 'verify_hcaptcha_app',
      v: ''
    },
  ]
  for (const config of configs) {
    await prisma.config.upsert({
      where: { k: config.k },
      update: {},
      create: config
    })
  }

  console.log(`✅数据填充完成.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });