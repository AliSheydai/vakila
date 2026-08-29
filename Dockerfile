# syntax=docker/dockerfile:1
# Vokala — Next.js app with custom server (WS + pg LISTEN)
# Build: docker compose build app

ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY services/app/package.json services/app/pnpm-lock.yaml* services/app/package-lock.json* ./
RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    else npm install; fi

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY services/app/ ./
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN if command -v pnpm >/dev/null 2>&1 && [ -f pnpm-lock.yaml ]; then pnpm build; else npm run build; fi

FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# unzip + gcompat: Xray linux-64 binary for Telegram VLESS→SOCKS5 proxy
RUN apk add --no-cache unzip curl gcompat \
  && addgroup -g 1001 -S nodejs \
  && adduser -S -u 1001 -G nodejs nextjs \
  && corepack enable && corepack prepare pnpm@latest --activate

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/db ./db
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/next.config.ts ./next.config.ts

# Prefetch Xray-core so the Telegram VLESS→SOCKS5 proxy works offline at runtime
ARG XRAY_VERSION=25.3.6
RUN mkdir -p /app/.xray \
  && curl -fsSL -o /tmp/xray.zip \
    "https://github.com/XTLS/Xray-core/releases/download/v${XRAY_VERSION}/Xray-linux-64.zip" \
  && unzip -o /tmp/xray.zip -d /tmp/xray-extract \
  && mv /tmp/xray-extract/xray /app/.xray/xray \
  && chmod +x /app/.xray/xray \
  && echo "${XRAY_VERSION}" > /app/.xray/VERSION \
  && rm -rf /tmp/xray.zip /tmp/xray-extract \
  && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

# Run migrations then start custom server (Next + WebSocket)
CMD ["sh", "-c", "npx tsx db/migrate.ts && npx tsx server.ts"]
