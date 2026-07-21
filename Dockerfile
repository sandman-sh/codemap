# Multi-stage Dockerfile for CodeMapAI Express API
FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

# Build stage
FROM base AS builder
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/ ./apps/api/
COPY packages/ ./packages/
COPY scripts/ ./scripts/
COPY tsconfig.base.json tsconfig.json ./

RUN pnpm install
RUN pnpm run typecheck:packages && pnpm --filter @codemapai/api build

# Production runner stage for Express API
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app /app

EXPOSE 3001
CMD ["node", "apps/api/dist/index.mjs"]
