# 瞬刻 - 后端服务文档

## 项目概述

瞬刻后端是基于 Node.js + Express 5 + TypeScript + Prisma + MySQL 构建的现代化内容发布平台后端服务。提供双 Token 认证、邮箱验证注册、文章（文字/图片/视频）发布、评论与表情、点赞、通知系统、友情链接、位置服务、文件上传（本地 / S3 兼容存储）与后台管理能力。

## 技术栈

- 运行时：Node.js 24+
- 框架：Express 5
- 语言：TypeScript（ES Modules）
- 数据库：MySQL 5.7+ / 8.0+
- ORM：Prisma
- 认证：JWT 双 Token（Access + Refresh），jsonwebtoken
- 密码：bcrypt
- 邮件：nodemailer
- 对象存储：@aws-sdk/client-s3、multer-s3（兼容 Cloudflare R2 等 S3 协议）
- 上传中间件：multer
- 包管理：pnpm

## 目录结构

```text
backend/
├── prisma/                       # 数据库相关
│   ├── schema.prisma             # 数据模型定义
│   ├── migrations/               # 迁移文件
│   └── seed.ts                   # 种子数据
├── src/
│   ├── bootstrap.ts              # 应用入口（先加载 .env，再动态导入 index）
│   ├── index.ts                  # Express 应用装配、路由注册、错误处理
│   ├── lib/
│   │   └── prisma.ts             # Prisma 客户端封装
│   ├── middleware/
│   │   ├── authMiddleware.ts          # 强制认证（验证 Access Token）
│   │   ├── adminMiddleware.ts         # 管理员权限
│   │   ├── optionalAuthMiddleware.ts  # 可选认证（游客可访问）
│   │   └── httpLogger.middleware.ts   # HTTP 请求日志
│   ├── routes/                   # 路由模块（资源化命名）
│   │   ├── auth.ts               # 认证：注册/登录/刷新/登出/me/重置密码
│   │   ├── user.ts               # 用户：当前/修改/主页/改密
│   │   ├── articles.ts           # 文章：CRUD/评论/点赞
│   │   ├── comments.ts           # 评论：发布/删除/列表
│   │   ├── notice.ts             # 通知发送：邮件/验证码/hCaptcha 校验
│   │   ├── notices.ts            # 通知中心：列表/未读数/已读/删除
│   │   ├── upload.ts             # 文件上传：本地 / S3
│   │   ├── link.ts               # 前台友情链接读取
│   │   ├── location.ts           # IP 位置服务
│   │   └── admin.ts              # 后台管理接口
│   ├── services/                 # 业务逻辑
│   │   ├── auth.service.ts       # 登录态校验、用户可用性
│   │   ├── token.service.ts      # Access/Refresh Token 签发与校验
│   │   ├── session.service.ts    # 会话记录管理（jti、状态、过期）
│   │   ├── mail.service.ts       # 邮箱验证码生成、发送与校验
│   │   ├── verify.service.ts     # hCaptcha 人机校验
│   │   ├── file.service.ts       # 文件本地/对象存储处理
│   │   ├── config.service.ts     # 站点配置缓存
│   │   ├── config-query.service.ts # 配置查询解析
│   │   ├── notice.service.ts     # 通知序列化与发送
│   │   ├── location.service.ts   # IP 定位（优先 IPv4）
│   │   └── log.service.ts        # 操作日志
│   ├── types/
│   │   └── express.d.ts          # Express 类型扩展（请求用户）
│   ├── utils/
│   │   └── logger.ts             # 上下文日志器
│   └── seed.ts                   # 种子数据入口
├── dist/                         # 编译输出
├── .env.example                  # 环境变量模板
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

## 数据库设计

采用 Prisma 管理，主要模型（`backend/prisma/schema.prisma`）：

| 模型 | 说明 |
| --- | --- |
| `users` | 用户：账号密码、昵称、简介、角色、状态、邮箱、头像、背景 |
| `user_sessions` | 会话记录：session_id、access/refresh jti、设备指纹、状态、过期 |
| `articles` | 文章：内容、类型(文字/图片/视频)、置顶、广告、位置、点赞/评论计数 |
| `article_images` | 文章图片，支持排序 |
| `article_videos` | 文章视频，含封面与时长 |
| `article_likes` | 用户点赞（联合主键） |
| `article_guest_likes` | 游客点赞（IP + 游客标识） |
| `comments` | 评论：父子嵌套回复、软删除 |
| `tags` / `article_tags` | 文章标签与关联表 |
| `notices` | 通知：系统/评论/点赞/警告/关注/私信，已读状态 |
| `link` | 友情链接：图标、站点名、简介、URL、显隐 |
| `config` | 站点配置：键值对，含分类、访问级别（public/user/admin） |
| `logs` | 系统操作日志：行为、目标、IP、UA、状态 |

## 认证系统

### 双 Token 机制

- **Access Token**：短时（默认 2 小时，`JWT_ACCESS_EXPIRES_SECONDS`），用于接口认证。
- **Refresh Token**：长时（默认 30 天，`JWT_REFRESH_EXPIRES_SECONDS`），用于换取新 Access Token。
- 每个 Token 携带 `sub`（用户）、`sid`（会话）、`jti`（唯一标识），服务端在 `user_sessions` 表维护会话状态。
- Token 刷新时进行 **jti 轮换**：旧 Refresh Token 失效，签发新一对。
- 支持单设备登出（`/logout`）与全设备登出（`/logout-all`）。

### 注册与登录

- 注册（`POST /api/auth/register`）：用户名 + 密码，可选开启邮箱验证（`user_email_verify_register` 配置）+ hCaptcha。
- 账密登录（`POST /api/auth/login`）：用户名或邮箱 + 密码。
- 邮箱验证码登录（`POST /api/auth/login-email`）：邮箱 + 验证码。
- 邮箱验证码通过 `/api/notice/sendEmail` 发送、`/api/notice/verifyEmail` 校验。
- 用户状态：0 未激活 / 1 正常 / 2 封禁（含 `banned_until`）。

### 中间件

- `authMiddleware`：强制认证，校验 Access Token，注入 `req.user`。
- `optionalAuthMiddleware`：可选认证，支持游客访问与游客互动（点赞）。
- `adminMiddleware`：校验 `role === 1` 的管理员权限。

## 主要 API 概览

| 路由前缀 | 主要端点 |
| --- | --- |
| `/api/auth` | `register` `login` `login-email` `refresh` `logout` `logout-all` `me` `reset-password` |
| `/api/user` | `GET /` `PATCH /` `GET /:username` `PATCH /password` |
| `/api/articles` | `POST /` `GET /` `GET /:id` `PATCH /:id` `DELETE /:id` `GET /:id/comments` `POST /:id/like` `DELETE /:id/like` `GET /:id/like` |
| `/api/comments` | `POST /` `DELETE /:id` `GET /:articleId` |
| `/api/notices` | `GET /` `GET /unread-count` `PATCH /read-all` `PATCH /:id/read` `DELETE /:id` |
| `/api/notice` | `POST /sendEmail` `POST /verifyEmail` `POST /hcaptcha` |
| `/api/upload` | `POST /`（本地）`POST /s3`（对象存储） |
| `/api/link` | `GET`（前台读取）`POST`（新增，需认证） |
| `/api/location` | `GET /`（IP 定位） |
| `/api/admin` | 用户/文章/评论/友链/通知/配置管理（均需管理员） |

### 响应格式

```json
{
  "success": true,
  "message": "响应信息",
  "data": {}
}
```

需要认证的接口在请求头携带：`Authorization: Bearer <access_token>`。

## 文件上传

支持两种模式，由后台上传设置决定：

- **本地上传**：multer 处理，文件落到 `public/` 目录，由 Express 静态托管。
- **S3 兼容对象存储**：通过 `multer-s3` + `@aws-sdk/client-s3` 上传到 Cloudflare R2 等 S3 兼容服务。

## 通知系统

- 点对点通知模型，`NoticeType` 枚举：`SYSTEM` / `COMMENT` / `LIKE` / `ALERT` / `FOLLOW` / `MESSAGE`。
- 业务事件（被评论、被点赞等）自动创建通知，前台 `/notifications` 页面消费。
- 支持未读数统计、批量已读、单条已读、删除。
- 邮箱验证码独立于通知系统，由 `mail.service` 管理验证码生成、存储与校验。

## 本地开发

### 环境要求

- Node.js 24+
- pnpm 11+
- MySQL 5.7+/8.0+

### 安装与配置

```bash
cd backend
pnpm install
cp .env.example .env
```

编辑 `backend/.env`：

```env
# 程序监听地址和端口
HOST=0.0.0.0
PORT=9889

# 密钥：必须改成随机值，生产环境使用占位值或长度不足 32 位会拒绝启动
# 生成方式：openssl rand -hex 32
JWT_SECRET=demo_jwt_secret
JWT_ACCESS_EXPIRES_SECONDS=7200
JWT_REFRESH_EXPIRES_SECONDS=2592000

# MySQL 数据库配置
DATABASE_URL="mysql://root:123456@127.0.0.1:3306/moment"
```

### 初始化与启动

```bash
pnpm run db:setup  # 生成 Prisma Client、执行迁移并写入种子数据
pnpm run dev       # 启动开发服务（tsx watch）
```

默认运行在 `http://localhost:9889/api`。

### 常用命令

```bash
pnpm run dev        # 启动开发服务
pnpm run build      # 生成 Prisma Client 并编译 TypeScript
pnpm run start      # 运行编译后的服务（node dist/bootstrap.js）
pnpm run db:setup   # 生成 Prisma Client、迁移并写入种子数据
pnpm run start:pm2  # 使用 PM2 运行
```

## 部署

### 生产构建

```bash
cd backend
pnpm install --frozen-lockfile
pnpm run build
pnpm run db:setup   # 首次部署执行迁移与种子
pnpm run start      # 或 pnpm run start:pm2 后台运行
```

### PM2

```bash
pnpm run start:pm2
pm2 startup         # 开机自启
pm2 save
```

### Nginx 反向代理示例

```nginx
location /api {
    proxy_pass http://127.0.0.1:9889;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 日志规范

使用 `backend/src/utils/logger.ts` 的上下文日志器，禁止直接 `console.log`：

```ts
import { Logger } from '../utils/logger.js'

const logger = new Logger('AuthService')

logger.log('message')
logger.warn('message')
logger.error('message', error instanceof Error ? error.stack : String(error))
logger.debug('message')
```

HTTP 请求日志由 `httpLogger.middleware.ts` 在应用创建处统一接入。上下文命名示例：`APP`、`HTTP`、`AuthService`。不得记录密钥、Token、密码、完整请求体等敏感信息。
