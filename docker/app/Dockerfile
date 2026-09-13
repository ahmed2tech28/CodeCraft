# CodeCraft All-in-One Production Dockerfile
FROM node:20-slim AS builder

WORKDIR /app

# Install system tools
RUN apt-get update && apt-get install -y git python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install PNPM
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate

# Copy workspace manifests
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY packages/ai/package.json ./packages/ai/
COPY packages/sandbox/package.json ./packages/sandbox/
COPY packages/agent/package.json ./packages/agent/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/ui/package.json ./packages/ui/
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy full source tree
COPY . .

# Build all packages and applications
RUN pnpm build

# Production Runner Stage
FROM node:20-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y git curl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate

ENV NODE_ENV=production
ENV PORT=3001
ENV WEB_PORT=3000
ENV HOST=0.0.0.0

# Copy entire build workspace from builder
COPY --from=builder /app /app

# Ensure persistent data directory exists
RUN mkdir -p /app/data

EXPOSE 3000 3001

# Start both Fastify API server and Next.js frontend via pnpm
CMD ["pnpm", "start"]
