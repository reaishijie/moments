FROM node:22-alpine

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

CMD ["sh", "-c", "prisma migrate deploy && node dist/bootstrap.js"]
