import { prisma } from './lib/prisma.js';
import bcrypt from 'bcrypt';

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
  const cfg = (
    k: string,
    v: string,
    name: string,
    description: string,
    category: string,
    sort: number,
    access_level: 'public' | 'user' | 'admin' = 'admin'
  ) => ({ k, v, name, description, category, sort, access_level });

  const configs = [
    // 网站信息
    cfg('sitename', '瞬刻', '网站名称', '用于页面标题和站点展示', 'site', 10, 'public'),
    cfg('site_url', '', '网站地址', '站点公开访问地址', 'site', 20, 'admin'),
    cfg('site_email', '', '管理员邮箱', '用于站点联系和通知展示', 'site', 30, 'admin'),
    cfg('site_keywords', '瞬刻,微信朋友圈,记录瞬间,博客程序,内容发布,博客', '站点关键词', '用于 SEO 的关键词', 'site', 40, 'public'),
    cfg('site_description', '瞬刻是一个现代化的社交媒体应用，专注于为用户提供简洁、流畅的内容分享体验。项目采用前后端分离架构，支持文字、图片、视频等多种内容类型的发布和交互。', '站点描述', '用于 SEO 和页面介绍', 'site', 50, 'public'),
    // 网站背景图
    cfg('site_background', '/img/background.avif', '站点背景', '公共页面背景图片地址', 'site', 60, 'public'),
    // 网站LOGO
    cfg('site_logo', '/img/avatar.jpg', '站点 Logo', '站点 Logo 图片地址', 'site', 70, 'public'),
    cfg('site_font', '', '自定义字体', '公共页面自定义字体配置', 'site', 80, 'public'),
    // 首页用户背景
    cfg('site_header_background', '', '首页头图', '首页 Header 背景图片地址', 'site', 90, 'public'),
    cfg('site_avatar', '/img/avatar.jpg', '首页头像', '首页头像图片地址', 'site', 100, 'public'),
    cfg('site_brief', '', '首页简介', '首页个人简介文案', 'site', 110, 'public'),
    cfg('site_footer_html', '', 'Footer HTML', '底部版权、备案号、社交链接等 HTML', 'custom', 10, 'public'),
    cfg('site_left_corner_html', '', '左下角 HTML', '左下角悬浮信息 HTML', 'custom', 20, 'public'),
    cfg('site_right_corner_html', '', '右下角 HTML', '右下角悬浮信息 HTML', 'custom', 30, 'public'),
    cfg('site_stat_enabled', '0', '统计脚本开关', '是否启用结构化统计脚本', 'custom', 40, 'public'),
    cfg('site_stat_script_url', '', '统计脚本地址', '统计脚本 src 地址，例如 //js.llk.hk', 'custom', 50, 'public'),
    cfg('site_stat_site_id', '', '统计站点 ID', '统计服务的站点 ID，例如 cf7191d1', 'custom', 60, 'public'),
    // 发件邮箱
    cfg('mail_host', 'smtp.qq.com', 'SMTP 主机', '发件邮箱 SMTP 服务地址', 'email', 10, 'admin'),
    cfg('mail_port', '465', 'SMTP 端口', '发件邮箱 SMTP 服务端口', 'email', 20, 'admin'),
    cfg('mail_secure', 'true', '安全连接', '是否启用 SMTP 安全连接', 'email', 30, 'admin'),
    cfg('mail_user', '', '邮箱账号', '发件邮箱账号', 'email', 40, 'admin'),
    cfg('mail_pass', '', '邮箱授权码', '发件邮箱授权码或密码', 'email', 50, 'admin'),
    cfg('user_auth', '0', '注册审核', '是否开启用户注册审核', 'user', 10, 'admin'),
    cfg('user_captcha', '0', '登录注册验证', '登录注册验证码开关', 'verify', 10, 'public'),
    cfg('user_captcha_article', '0', '发文验证', '用户发表文章是否需要验证', 'verify', 20, 'public'),
    cfg('user_captcha_comment', '0', '评论验证', '用户发表评论是否需要验证', 'verify', 30, 'public'),
    cfg('user_captcha_update', '0', '资料更新验证', '用户更新信息是否需要验证', 'verify', 40, 'public'),
    cfg('user_status', '1', '用户系统状态', '用户系统是否开放', 'user', 20, 'public'),
    cfg('verify_hcaptcha_user', '', 'hCaptcha Secret', 'hCaptcha 服务端密钥', 'verify', 50, 'admin'),
    cfg('verify_hcaptcha_app', '', 'hCaptcha Site Key', 'hCaptcha 客户端站点 Key', 'verify', 60, 'public'),
    cfg('upload_method', '0', '上传方式', '文件上传方式，0 为本地，1 为 S3', 'upload', 10, 'public'),
    cfg('upload_number', '9', '上传数量', '单次最多上传文件数量', 'upload', 20, 'public'),
    cfg('upload_size', '5', '上传大小', '单文件大小限制，单位 M', 'upload', 30, 'public'),
    cfg('upload_s3_endpoint', '', 'S3 Endpoint', 'S3 或 R2 端点地址', 'upload', 40, 'admin'),
    cfg('upload_s3_region', '', 'S3 Region', 'S3 或 R2 区域', 'upload', 50, 'admin'),
    cfg('upload_s3_bucketname', '', 'S3 Bucket', 'S3 或 R2 存储桶名称', 'upload', 60, 'admin'),
    cfg('upload_s3_id', '', 'S3 Access Key', 'S3 或 R2 Access Key ID', 'upload', 70, 'admin'),
    cfg('upload_s3_secret', '', 'S3 Secret Key', 'S3 或 R2 Secret Access Key', 'upload', 80, 'admin'),
    cfg('upload_s3_domain', '', 'S3 访问域名', 'S3 或 R2 文件访问域名', 'upload', 90, 'admin'),
    cfg('location_method', '0', '位置服务', '位置信息接口类型，0 为 ping0', 'location', 10, 'public'),
    cfg('link_brief', '我的好朋友', '友情链接简介', '友情链接页面顶部描述', 'link', 10, 'public'),
  ]
  for (const config of configs) {
    await prisma.config.upsert({
      where: { k: config.k },
      update: {
        name: config.name,
        description: config.description,
        category: config.category,
        sort: config.sort,
        access_level: config.access_level,
      },
      create: config
    })
  }

  console.log(`✔ 数据填充完成.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
