# 瞬刻 Moments

> 更简洁、更现代化的内容发布平台。支持文字、图片、视频内容发布，适合个人动态、轻博客、朋友圈式内容站点。

<p>
  <a href="LICENSE.md"><img src="https://img.shields.io/badge/License-Apache--2.0-blue?style=for-the-badge" alt="License"></a>
  <a href="https://github.com/reaishijie/moments"><img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"></a>
  <img src="https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vue.js&logoColor=4FC08D" alt="Vue.js">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
</p>

使用 Vercel 快速部署前端：

[<img src="https://vercel.com/button" alt="Deploy on Vercel" height="30">](https://vercel.com/new/clone?repository-url=https://github.com/reaishijie/moments&root-directory=frontend&env=VITE_API_BASE_URL&project-name=moments&repository-name=moments)

## 项目概述

瞬刻是一个前后端分离的现代化内容发布平台，前端采用 Vue 3 + Vite，后端采用 Express + Prisma + MySQL。项目内置用户认证、文章发布、媒体上传、评论互动、友情链接、通知与后台管理等能力。

## 功能特性

- 🚀 **现代化技术栈**：Vue 3、Vite、TypeScript、Express 5、Prisma、MySQL
- 📱 **移动端优先**：适配手机浏览，兼顾桌面端体验
- 🌓 **浅色/深色模式**：前端支持全局暗色主题与回到顶部
- 🔐 **双 Token 认证**：短时 Access Token + 长效 Refresh Token，支持会话记录与登出，游客可访问与互动
- 📧 **邮箱验证注册**：注册邮箱验证码 + hCaptcha 人机校验
- 📝 **内容发布**：支持文字、图片、视频、视频封面、文章标签（TAG）
- 💬 **评论互动**：支持文章评论、回复与表情
- 📍 **位置服务**：发布文章时可选地理位置
- 🖼️ **文件上传**：支持本地上传与 S3 兼容对象存储（如 Cloudflare R2）
- 🔗 **扩展页面**：友情链接独立页面、通知中心、推广/广告跳转
- 🛠️ **后台管理**：管理员后台界面，管理文章、用户、链接、通知与站点配置
- 📊 **日志系统**：后端内置上下文日志与 HTTP 请求日志

## 项目预览

### 前台

| 首页（亮） | 首页（暗） | 文章详情 |
| :---: | :---: | :---: |
| <img width="280" alt="首页亮色" src="https://upload.321521.xyz/desc/home-light.png" /> | <img width="280" alt="首页暗色" src="https://upload.321521.xyz/desc/home-dark.png" /> | <img width="280" alt="文章详情" src="https://upload.321521.xyz/desc/article-detail.png" /> |

| 用户主页 | 个人资料 | 发布文章 |
| :---: | :---: | :---: |
| <img width="280" alt="用户主页" src="https://upload.321521.xyz/desc/user-home.png" /> | <img width="280" alt="个人资料" src="https://upload.321521.xyz/desc/profile.png" /> | <img width="280" alt="发布文章" src="https://upload.321521.xyz/desc/post-article.png" /> |

| 消息通知 | 友情链接 | 推广跳转 |
| :---: | :---: | :---: |
| <img width="280" alt="消息通知" src="https://upload.321521.xyz/desc/notifications.png" /> | <img width="280" alt="友情链接" src="https://upload.321521.xyz/desc/links.png" /> | <img width="280" alt="推广跳转" src="https://upload.321521.xyz/desc/promote.png" /> |

| 账密登录 | 邮箱验证码登录 | 注册 |
| :---: | :---: | :---: |
| <img width="280" alt="账密登录" src="https://upload.321521.xyz/desc/login.png" /> | <img width="280" alt="邮箱验证码登录" src="https://upload.321521.xyz/desc/login-email.png" /> | <img width="280" alt="注册" src="https://upload.321521.xyz/desc/register.png" /> |

### 后台

| 控制台 | 用户管理 | 文章管理 |
| :---: | :---: | :---: |
| <img width="280" alt="控制台" src="https://upload.321521.xyz/desc/admin-dashboard.png" /> | <img width="280" alt="用户管理" src="https://upload.321521.xyz/desc/admin-user.png" /> | <img width="280" alt="文章管理" src="https://upload.321521.xyz/desc/admin-article.png" /> |

| 评论管理 | 友链管理 | 用户设置 |
| :---: | :---: | :---: |
| <img width="280" alt="评论管理" src="https://upload.321521.xyz/desc/admin-comment.png" /> | <img width="280" alt="友链管理" src="https://upload.321521.xyz/desc/admin-link.png" /> | <img width="280" alt="用户设置" src="https://upload.321521.xyz/desc/admin-setting-user.png" /> |

| 邮箱配置 | 验证设置 | 上传设置 |
| :---: | :---: | :---: |
| <img width="280" alt="邮箱配置" src="https://upload.321521.xyz/desc/admin-setting-email.png" /> | <img width="280" alt="验证设置" src="https://upload.321521.xyz/desc/admin-setting-verify.png" /> | <img width="280" alt="上传设置" src="https://upload.321521.xyz/desc/admin-setting-upload.png" /> |

| 基础设置 | 其他设置 |
| :---: | :---: |
| <img width="360" alt="基础设置" src="https://upload.321521.xyz/desc/admin-setting-basic.png" /> | <img width="360" alt="其他设置" src="https://upload.321521.xyz/desc/admin-setting-other.png" /> |

## 技术栈

<p>
  <img src="https://img.shields.io/badge/HTML-239120?style=for-the-badge&logo=html5&logoColor=white" alt="HTML">
  <img src="https://img.shields.io/badge/CSS-663399?style=for-the-badge&logo=css&logoColor=white" alt="CSS">
  <img src="https://img.shields.io/badge/JavaScript-2CA550?style=for-the-badge&logo=JavaScript&logoColor=white" alt="JavaScript">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vue.js&logoColor=4FC08D" alt="Vue.js">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Axios-%23039BE5.svg?&style=for-the-badge&logo=Axios&logoColor=white" alt="Axios">
  <img src="https://img.shields.io/badge/Pinia-43853D?style=for-the-badge&logo=pinia&logoColor=FBCE4B" alt="Pinia">
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL">
  <img src="https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white" alt="pnpm">
  <img src="https://img.shields.io/badge/Shell-121011?style=for-the-badge&logo=gnu-bash&logoColor=white" alt="Shell">
  <img src="https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel">
</p>

| 模块 | 技术 |
| --- | --- |
| 前端 | Vue 3、Vite、TypeScript、Vue Router、Pinia、Axios |
| 后端 | Node.js、Express 5、TypeScript、Prisma、JWT、Multer |
| 数据库 | MySQL |
| 上传 | 本地存储、S3 兼容对象存储 |
| 部署 | Node.js、PM2、Nginx/OpenResty、Docker |

## 目录结构

```text
moments/
├── frontend/             # Vue 3 + Vite 前端
│   ├── src/api/          # API 请求封装
│   ├── src/components/   # 公共组件
│   ├── src/router/       # 路由配置
│   ├── src/store/        # Pinia 状态管理
│   └── src/views/        # 页面
├── backend/              # Express + Prisma 后端
│   ├── prisma/           # Prisma schema 与迁移
│   └── src/
│       ├── routes/       # API 路由
│       ├── services/     # 业务服务
│       └── middleware/   # 中间件
├── momentsQuickDeploy/   # 快速部署目录
├── docs/                # 项目文档
└── build.sh             # 构建部署产物脚本
```

## 环境要求

- Node.js 24+
- pnpm 11+（仓库 packageManager 使用 pnpm）
- MySQL 5.7+/8.0+
- 可选：PM2、Nginx/OpenResty、Docker

## 本地开发

### 1. 克隆项目

```bash
git clone https://github.com/reaishijie/moments.git
cd moments
```

### 2. 启动后端

```bash
cd backend
pnpm install
cp .env.example .env
```

编辑 `backend/.env`，配置数据库与密钥：

```env
# 程序监听地址和端口
HOST=0.0.0.0
PORT=9889

# 密钥：必须改成随机值，生产环境使用占位值或长度不足 32 位会拒绝启动
# 生成方式：openssl rand -hex 32
JWT_SECRET=demo_jwt_secret
JWT_ACCESS_EXPIRES_SECONDS=7200
JWT_REFRESH_EXPIRES_SECONDS=2592000

# MySQL数据库配置
DATABASE_URL="mysql://root:123456@127.0.0.1:3306/moment"
```

初始化数据库并启动服务：

```bash
pnpm run db:setup
pnpm run dev
```

后端默认运行在：`http://localhost:9889/api`。

### 3. 启动前端

新开一个终端：

```bash
cd frontend
pnpm install
cp .env.example .env
pnpm run dev
```

前端开发服务默认运行在 Vite 输出的本地地址，接口地址默认示例为：

```env
VITE_API_BASE_URL=http://localhost:9889/api
```

## 常用命令

### 前端

```bash
cd frontend
pnpm run dev       # 启动开发服务
pnpm run build     # 类型检查并构建
pnpm run preview   # 预览构建产物
```

### 后端

```bash
cd backend
pnpm run dev       # 启动开发服务
pnpm run build     # 生成 Prisma Client 并编译 TypeScript
pnpm run start     # 运行编译后的后端服务
pnpm run db:setup  # 生成 Prisma Client、执行迁移并写入种子数据
```

## 部署说明

更多部署方式请查看：[快速部署文档](docs/quickDeploy-readme.md)。

### 前后端同域部署

使用 `build.sh` 打包前，请将前端环境变量配置为：

```env
VITE_API_BASE_URL=/api
```

然后执行：

```bash
./build.sh
```

### 前后端分离部署

前端 `.env` 中配置真实后端地址：

```env
VITE_API_BASE_URL=https://your-api-domain.com/api
```

后端构建并使用 PM2 运行：

```bash
cd backend
pnpm install
pnpm run build
pnpm run db:setup
pnpm run start:pm2
```

前端构建后，将 `frontend/dist` 部署到 Nginx/OpenResty、静态托管服务或 CDN：

```bash
cd frontend
pnpm install
pnpm run build
```

Nginx 单页应用伪静态示例：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

## 相关文档

- [快速部署](docs/quickDeploy-readme.md)
- [Docker 部署](docs/docker-readme.md)
- [更新计划](docs/update.md)
- [后端环境变量示例](backend/.env.example)
- [前端环境变量示例](frontend/.env.example)

## 开源协议

本项目采用 Apache-2.0 协议，详见 [LICENSE.md](LICENSE.md)。

## 致谢

感谢所有为本项目做出贡献的开发者和用户。

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=reaishijie/moments&type=Date)](https://www.star-history.com/#reaishijie/moments&Date)
