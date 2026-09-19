FROM node:20-alpine

# Install build tools, git, bash, and curl
RUN apk add --no-cache \
    git \
    bash \
    python3 \
    make \
    g++ \
    curl

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory for project code (volume mounted from host)
WORKDIR /workspace

# Ensure pnpm store is cached in container layer
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Expose port for preview dev server (used when running as preview container)
EXPOSE 3000

# Default command: keeps runner container alive for exec calls.
# Preview containers override this CMD via docker run / createContainer.
CMD ["sleep", "infinity"]
