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

- 🚀 **现代化技术栈**：Vue 3、Vite、TypeScript、Express、Prisma、MySQL
- 📱 **移动端优先**：适配手机浏览，兼顾桌面端体验
- 🌓 **浅色/深色模式**：前端支持全局暗色主题与回到顶部
- 🔐 **认证系统**：JWT 登录认证，支持游客访问与游客互动
- 📝 **内容发布**：支持文字、图片、视频、视频封面、文章标签
- 💬 **评论互动**：支持文章评论与回复
- 🖼️ **文件上传**：支持本地上传与 S3 兼容对象存储（如 Cloudflare R2）
- 🔗 **扩展页面**：友情链接、通知、推广/广告跳转
- 📊 **日志系统**：后端内置上下文日志与 HTTP 请求日志

## 项目预览

| 首页（亮） | 首页（暗） | 文章详情 |
| :---: | :---: | :---: |
| <img width="300" alt="首页亮色" src="https://github.com/user-attachments/assets/25231327-80e1-426f-9afd-6a1bf3fce939" /> | <img width="300" alt="首页暗色" src="https://github.com/user-attachments/assets/3ac8fdd8-46f7-4a17-bdfd-080737268c37" /> | <img width="300" alt="文章详情" src="https://github.com/user-attachments/assets/ca4ff306-5aec-4ec9-b06c-e8fb833fa8d6" /> |
| **推广** | **发布文章** | **用户资料** |
| <img width="300" alt="推广" src="https://github.com/user-attachments/assets/01710755-98d4-4b43-85b7-1b08a675fa27" /> | <img width="300" alt="发布文章" src="https://github.com/user-attachments/assets/45735944-d30d-4f9e-b05d-1c3017b0774f" /> | <img width="300" alt="用户资料" src="https://github.com/user-attachments/assets/b946afd9-3451-4175-a65a-20647e104b1d" /> |

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
├── doc/                  # 项目文档
└── build.sh              # 构建部署产物脚本
```

## 环境要求

- Node.js 20+（推荐 22+）
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
HOST=0.0.0.0
PORT=9889
JWT_SECRET=demo_jwt_secret
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=demo
DB_PASSWORD=123456
DB_DATABASE=demo
DATABASE_URL="mysql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}"
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

更多部署方式请查看：[快速部署文档](doc/quickDeploy-readme.md)。

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

- [快速部署](doc/quickDeploy-readme.md)
- [Docker 部署](doc/docker-readme.md)
- [更新计划](doc/update.md)
- [后端环境变量示例](backend/.env.example)
- [前端环境变量示例](frontend/.env.example)

## 开源协议

本项目采用 Apache-2.0 协议，详见 [LICENSE.md](LICENSE.md)。

## 致谢

感谢所有为本项目做出贡献的开发者和用户。

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=reaishijie/moments&type=Date)](https://www.star-history.com/#reaishijie/moments&Date)
