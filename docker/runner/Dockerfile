FROM node:20-alpine

# Install build tools, git, and bash
RUN apk add --no-cache \
    git \
    bash \
    python3 \
    make \
    g++ \
    curl

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Ensure pnpm store is cached in container layer if needed
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Default command keeps container ready for exec calls
CMD ["sleep", "infinity"]
