# syntax=docker/dockerfile:1
# Vokala monorepo — Next.js app (services/app)
# Build: docker compose build app

ARG NODE_VERSION=22-alpine

# ─── Base ───────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ─── Dependencies ───────────────────────────────────────────
FROM base AS deps
COPY services/app/package.json services/app/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ─── Build ──────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY services/app/ ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ─── Production runner ──────────────────────────────────────
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs \
  && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
