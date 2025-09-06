# 瞬刻 - 后端服务文档

## 项目概述

瞬刻后端是一个基于 Node.js + Express + TypeScript + Prisma + MySQL 构建的现代化社交媒体应用后端服务。提供用户认证、文章管理、评论系统、位置服务等核心功能。

## 程序设计

### 架构设计

```
backend/
├── src/                    # 源代码目录
│   ├── index.ts           # 应用入口文件
│   ├── middleware/        # 中间件
│   │   ├── authMiddleware.ts      # JWT认证中间件
│   │   ├── adminMiddleware.ts     # 管理员权限中间件
│   │   └── optionalAuthMiddleware.ts # 可选认证中间件
│   ├── routes/            # 路由模块
│   │   ├── auth.ts        # 认证相关路由
│   │   ├── user.ts        # 用户管理路由
│   │   ├── articles.ts    # 文章管理路由
│   │   ├── comments.ts    # 评论管理路由
│   │   └── location.ts    # 位置服务路由
│   ├── services/          # 业务逻辑服务
│   │   ├── log.service.ts # 日志服务
│   │   └── location.service.ts # 位置服务
│   ├── types/             # TypeScript 类型定义
│   │   └── express.d.ts   # Express 扩展类型
│   └── seed.ts            # 数据库种子文件
├── prisma/                # 数据库相关
│   ├── schema.prisma      # 数据库模型定义
│   └── migrations/        # 数据库迁移文件
├── dist/                  # 编译输出目录
├── package.json           # 项目配置文件
└── tsconfig.json         # TypeScript 配置
```

### 数据库设计

采用 Prisma ORM 管理数据库，主要数据模型包括：

- **users**: 用户表，存储用户基本信息、认证信息、权限等
- **articles**: 文章表，支持文字、图片、视频多种类型
- **comments**: 评论表，支持多级嵌套回复
- **article_likes**: 用户点赞表
- **article_guest_likes**: 游客点赞表
- **article_images**: 文章图片表
- **article_videos**: 文章视频表
- **logs**: 系统操作日志表

### 技术栈

- **运行时**: Node.js
- **框架**: Express.js
- **语言**: TypeScript
- **数据库**: MySQL
- **ORM**: Prisma
- **认证**: JWT (JSON Web Token)
- **密码加密**: bcrypt
- **跨域处理**: CORS
- **环境配置**: dotenv

## 功能实现

### 1. 用户认证系统

#### 注册功能

- 用户名/邮箱唯一性验证
- 密码 bcrypt 哈希加密
- 用户状态管理（未激活/正常/封禁）
- 操作日志记录

#### 登录功能

- 支持用户名或邮箱登录
- 密码验证
- JWT token 生成（7天有效期）
- 用户状态检查
- 登录失败日志记录

#### 认证中间件

- **authMiddleware**: 强制认证，验证 JWT token
- **optionalAuthMiddleware**: 可选认证，支持游客访问
- **adminMiddleware**: 管理员权限验证

### 2. 文章管理系统

#### 文章类型支持

- 文字文章
- 图片文章（多图支持）
- 视频文章（缩略图支持）

#### 文章功能

- 发布/编辑/删除文章
- 文章置顶功能
- 广告标记功能
- 位置信息绑定
- 点赞系统（用户+游客）
- 文章状态管理

### 3. 评论系统

#### 多级评论

- 支持无限层级嵌套回复
- 父子评论关系管理
- 评论计数自动维护

#### 评论管理

- 评论发布/删除
- 软删除机制
- 评论时间追踪

### 4. 位置服务

#### 地理位置功能

- ip.plus API
- IP 地址定位
- 位置信息获取和存储

### 5. 日志系统

#### 操作日志

- 用户行为追踪
- 系统操作记录
- IP 地址和 User-Agent 记录
- 操作状态追踪（成功/失败）

## 程序开发方法

### 开发环境搭建

1. **环境要求**

   - Node.js >= 16.x
   - MySQL >= 5.6
   - npm 或 yarn
2. **安装依赖**

   ```bash
   cd backend
   npm install
   ```
3. **环境配置**
   创建 `.env` 文件：

   ```env
   PORT=9889
   DB_HOST=127.0.0.1
   DATABASE_URL="mysql://username:password@localhost:3306/database_name"
   JWT_SECRET=your_jwt_secret_key
   TENCENT_MAP_KEY=your_tencent_map_api_key
   ```
4. **数据库初始化**

   ```bash
   # 生成 Prisma 客户端
   npx prisma generate

   # 运行数据库迁移
   npx prisma migrate deploy

   # 填充初始数据
   npm run db:setup
   ```

### 开发流程

1. **启动开发服务器**

   ```bash
   npm run dev
   ```
2. **代码结构规范**

   - 路由处理器放在 `routes/` 目录
   - 业务逻辑抽取到 `services/` 目录
   - 中间件统一放在 `middleware/` 目录
   - 类型定义放在 `types/` 目录
3. **数据库操作规范**

   - 使用 Prisma 客户端进行数据库操作
   - 遵循事务处理原则
   - 适当使用数据库索引优化查询
4. **错误处理**

   - 统一错误响应格式
   - 详细的错误日志记录
   - 适当的 HTTP 状态码

### API 设计规范

#### 响应格式

```json
{
  "status": "success|error",
  "message": "响应信息",
  "data": "响应数据",
  "error": "错误信息"
}
```

#### 认证要求

- 需要认证的接口在请求头中包含：`Authorization: Bearer <token>`
- 可选认证的接口支持游客访问

## 上线方法

### 1. 生产环境准备

#### 服务器要求

- Linux 服务器（推荐 Ubuntu 20.04+）
- Node.js 16+ 运行环境
- MySQL 8.0+ 数据库
- Nginx 反向代理
- SSL 证书（HTTPS）

#### 环境配置

```bash
# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2 进程管理器
npm install -g pm2

# 安装 MySQL
sudo apt update
sudo apt install mysql-server
```

### 2. 代码部署

#### 构建生产版本

```bash
# 安装依赖
npm ci --only=production

# 编译 TypeScript
npm run build

# 数据库迁移
npx prisma migrate deploy

# 生成 Prisma 客户端
npx prisma generate
```

#### PM2 配置

创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'pyq-backend',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 9889
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

#### 启动服务

```bash
# 启动应用
pm2 start ecosystem.config.js

# 设置开机自启
pm2 startup
pm2 save
```

### 3. Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /api {
        proxy_pass http://localhost:9889;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. 监控和维护

#### 日志管理

```bash
# 查看应用日志
pm2 logs pyq-backend

# 日志轮转
pm2 install pm2-logrotate
```

#### 性能监控

```bash
# 查看应用状态
pm2 status

# 监控应用性能
pm2 monit
```

#### 数据库维护

```bash
# 数据库备份
mysqldump -u username -p database_name > backup.sql

# 定期清理日志
# 在 crontab 中设置定期任务清理过期日志
```

### 5. 安全措施

#### 环境变量管理

- 使用 `.env` 文件管理敏感配置
- 设置强密码和复杂的 JWT 密钥
- 定期更新依赖包

#### 防火墙配置

```bash
# 只开放必要端口
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

#### SSL/TLS 配置

- 使用 Let's Encrypt 免费证书
- 配置 HTTPS 强制跳转
- 设置安全的 SSL 参数

### 6. 部署脚本示例

创建 `deploy.sh`：

```bash
#!/bin/bash

# 停止应用
pm2 stop pyq-backend

# 拉取最新代码
git pull origin main

# 安装依赖
npm ci --only=production

# 构建应用
npm run build

# 数据库迁移
npx prisma migrate deploy

# 重启应用
pm2 restart pyq-backend

echo "部署完成！"
```

## 常见问题

### Q: JWT token 过期如何处理？

A: 前端需要实现 token 刷新机制，或者引导用户重新登录。

### Q: 数据库连接池如何配置？

A: 在 Prisma schema 中配置 `datasource` 的连接参数。

### Q: 如何处理文件上传？

A: 当前版本暂未实现文件上传，建议使用第三方云存储服务。

### Q: 如何扩展新的 API 接口？

A: 在 `routes/` 目录下创建新的路由文件，并在 `index.ts` 中注册路由。

## 联系方式

如有问题，请联系开发团队或提交 Issue。
