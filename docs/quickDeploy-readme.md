# 瞬刻 - 快速部署文档

> `momentsQuickDeploy/` 是已打包好前后端的快速部署目录：前端构建产物放在 `public/`，后端编译产物放在 `dist/`，由 Express 统一托管。部署机只需 Node.js + pnpm + MySQL 即可运行，无需再单独构建前端。

## 方式一：Docker 部署

详见 [docker-readme.md](docker-readme.md)。`momentsQuickDeploy/` 内已自带 `Dockerfile` 与 `docker-compose.yml`（含 MySQL 8.0）。

## 方式二：Node 部署

### 1. 环境要求

- Node.js 24+
- pnpm 11+
- MySQL 5.7+/8.0+

### 2. 获取代码

```bash
git clone https://github.com/reaishijie/moments.git
cd moments/momentsQuickDeploy
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，主要修改数据库连接与密钥：

```env
# 程序监听地址和端口
HOST=0.0.0.0
PORT=9889

# 密钥：可以不填，容器启动脚本会自动生成随机密钥并持久化到 app_data 卷；
# 如需显式指定，请使用 openssl rand -hex 32 生成的值
# JWT_SECRET=
JWT_ACCESS_EXPIRES_SECONDS=7200
JWT_REFRESH_EXPIRES_SECONDS=2592000

# MySQL 数据库配置
DATABASE_URL="mysql://用户名:密码@127.0.0.1:3306/数据库名"
```

### 4. 安装依赖

```bash
pnpm install --prod   # 仅安装运行依赖；如需后续重新编译可去掉 --prod
```

### 5. 初始化数据库

```bash
pnpm run db:install   # 生成 Prisma Client、执行迁移并写入种子数据
```

### 6. 启动服务

```bash
pnpm run start        # 前台运行：node dist/bootstrap.js

# 推荐使用 PM2 后台保活
pnpm run start:pm2
```

默认监听 `http://127.0.0.1:9889`，接口根路径为 `/api`，前端由 `/` 直接托管。

### 7. 设置反向代理

将你的域名反向代理到 `http://127.0.0.1:9889`，并在前端路由上做单页伪静态：

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location /api {
        proxy_pass http://127.0.0.1:9889;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:9889;
        try_files $uri $uri/ /index.html;
    }
}
```

## 更新部署包

当后端或前端源码更新后，需在项目根目录重新生成 `momentsQuickDeploy/`：

```bash
./build.sh   # 构建 frontend → public，构建 backend → dist，并复制 prisma/package.json
```

> 注意：`build.sh` 会保留 `momentsQuickDeploy/` 内已有的 `.env.docker`、`docker-compose.yml`、`Dockerfile`。若这些模板有调整，需手动同步。

## 附录：安装 Node.js 与 pnpm

### Linux（nvm）

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
\. "$HOME/.nvm/nvm.sh"
nvm install 22
node -v   # v22.x
```

### Windows（Chocolatey）

```powershell
powershell -c "irm https://community.chocolatey.org/install.ps1|iex"
choco install nodejs --version="22.19.0"
```

### pnpm

```bash
npm install -g pnpm
# 或启用 corepack（Node 自带）
corepack enable
pnpm -v
```

### PM2（后台保活）

```bash
npm install -g pm2
pm2 -v
```
