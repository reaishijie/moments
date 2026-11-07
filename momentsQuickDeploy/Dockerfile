FROM node:24-alpine

WORKDIR /app

# Prisma 的查询引擎在 alpine 上依赖 openssl，缺少时会启动失败
RUN apk add --no-cache openssl \
  && corepack enable \
  && corepack prepare pnpm@11.8.0 --activate

# 安装依赖
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

# 复制代码和配置
COPY dist ./dist
COPY prisma ./prisma
COPY public ./public
COPY .env.docker ./
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# JWT_SECRET 由启动脚本生成并持久化到 /app/data（docker-compose 中挂载为命名卷）
VOLUME ["/app/data"]

EXPOSE 9889

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-9889}/api" >/dev/null 2>&1 || exit 1

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# 执行数据库初始化并启动项目
CMD ["sh", "-c", "pnpm run db:install && node dist/bootstrap.js"]
