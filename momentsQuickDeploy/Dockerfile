FROM node:20-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm install --omit=dev

# 复制代码和配置
COPY dist ./dist
COPY prisma ./prisma
COPY public ./public
COPY .env.docker ./

EXPOSE 9889

# 执行数据库初始化并启动项目
CMD ["sh", "-c", "npm run db:install && node dist/index.js"]
