FROM node:20-alpine

WORKDIR /app

# 安装依赖
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

# 复制代码和配置
COPY dist ./dist
COPY prisma ./prisma
COPY public ./public
COPY .env.docker ./

EXPOSE 9889

# 执行数据库初始化并启动项目
CMD ["sh", "-c", "pnpm run db:install && node dist/index.js"]
