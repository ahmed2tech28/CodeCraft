FROM node:20-alpine

# Install git, bash and utilities
RUN apk add --no-cache git bash curl

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Expose Vite dev server port
EXPOSE 3000

# Default command launches dev server with host binding
CMD ["pnpm", "dev", "--host", "0.0.0.0", "--port", "3000"]
