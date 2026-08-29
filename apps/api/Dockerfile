FROM node:22-alpine AS base
WORKDIR /app

# ─── Dependencies ────────────────────────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/database/package*.json ./packages/database/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci --workspace=apps/api --workspace=packages/database --workspace=packages/shared

# ─── Builder ─────────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build --workspace=packages/database
RUN npm run build --workspace=apps/api

# ─── Production Runner ────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 bellacasa
RUN adduser --system --uid 1001 bellacasa

COPY --from=builder --chown=bellacasa:bellacasa /app/apps/api/dist ./dist
COPY --from=builder --chown=bellacasa:bellacasa /app/node_modules ./node_modules
COPY --from=builder --chown=bellacasa:bellacasa /app/apps/api/package.json ./package.json

RUN mkdir logs && chown bellacasa:bellacasa logs

USER bellacasa

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -q -O /dev/null http://localhost:3001/api/v1/health/live || exit 1

CMD ["node", "dist/src/main"]
