import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log(`⚡ 开始网站创建管理员...`);
  const adminUsername = 'admin';
  const email = 'supremexiaohui@gmail.com'
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
    console.log(`✔ 管理员用户 "${adminUsername}" 已创建，默认密码: ${password}`);
  } else {
    console.log(`✗ 管理员用户 "${adminUsername}" 已存在，跳过创建.`);
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
      v: '/img/avatar.jpg'
    },
    {
      // 网站自定义字体
      k: 'site_font',
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
      // 用户发表文章是否需要验证 0 不需要， 1需要
      k: 'user_captcha_article',
      v: '0'
    },
    {
      // 用户发表评论是否需要验证 0 不需要， 1需要
      k: 'user_captcha_comment',
      v: '0'
    },
    {
      // 用户 更新信息 是否需要验证 0 不需要， 1需要
      k: 'user_captcha_update',
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
    {
      // 文件上传方式 0 为本地， 1为s3
      k: 'upload_method',
      v: '0'
    },
    {
      // 文件上传数量
      k: 'upload_number',
      v: '9'
    },
    {
      // 单文件大小(单位 M)
      k: 'upload_size',
      v: '5'
    },
    {
      // 端点（R2 必填）
      k: 'upload_s3_endpoint',
      v: ''
    },
    {
      // 区域
      k: 'upload_s3_region',
      v: ''
    },
    {
      // 储存桶名称
      k: 'upload_s3_bucketname',
      v: ''
    },
    {
      // accessKeyId
      k: 'upload_s3_id',
      v: ''
    },
    {
      // secretAccessKey
      k: 'upload_s3_secret',
      v: ''
    },
    {
      // 域名
      k: 'upload_s3_domain',
      v: ''
    },
    {
      // 位置信息接口 0 为ping0
      k: 'location_method',
      v: '0'
    },
    {
      // 友情链接页面描述
      k: 'link_brief',
      v: '我的好朋友'
    },
  ]
  for (const config of configs) {
    await prisma.config.upsert({
      where: { k: config.k },
      update: {},
      create: config
    })
  }

  console.log(`✔ 数据填充完成.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });