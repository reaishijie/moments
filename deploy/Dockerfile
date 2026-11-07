FROM node:24-alpine

WORKDIR /app

RUN apk add --no-cache openssl \
  && corepack enable \
  && corepack prepare pnpm@11.8.0 --activate \
  && npm install -g prisma@6.19.3

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma

RUN pnpm install --prod --frozen-lockfile \
  && prisma generate

COPY dist ./dist
COPY public ./public

EXPOSE 9889

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:9889/api >/dev/null 2>&1 || exit 1

CMD ["sh", "-c", "prisma migrate deploy && node dist/bootstrap.js"]
