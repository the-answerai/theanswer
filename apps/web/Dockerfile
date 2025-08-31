FROM --platform=linux/amd64 node:20-slim AS base

# This Dockerfile is optimized for Next.js standalone mode deployment
# Make sure you update both files if copying to documentation!

# Add metadata labels
LABEL maintainer="AnswerAI Team"
LABEL version="1.0.0"
LABEL description="AnswerAI Web Application"

WORKDIR /app

# Install essential tools for build process, pnpm, turbo, and configure pnpm store
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    git \
    openssl \
    unzip \
    wget \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g pnpm turbo@1 \
    && pnpm config set store-dir /root/.pnpm-store

################################################################################

FROM base AS installer
WORKDIR /app

# Build arguments and environment variables
# BWS (Bitwarden Secrets) - commented for future use
# ARG BWS_ACCESS_TOKEN
# ENV BWS_ACCESS_TOKEN=$BWS_ACCESS_TOKEN

# Active build arguments and environment variables  
ARG AUTH0_BASE_URL
ENV AUTH0_BASE_URL=$AUTH0_BASE_URL

# Use dummy DATABASE_URL for Prisma client generation during build
# This is only needed for prisma generate, the real DATABASE_URL comes from runtime secrets
ENV DATABASE_URL=postgresql://example_user:example_password@postgres:5432/example_db?schema=web


# Copy the entire project
COPY . .

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/root/.pnpm-store pnpm install

# Build the application with BWS token
# RUN --mount=type=cache,target=/app/node_modules/.cache pnpm secure-run "turbo build --filter=web"
RUN --mount=type=cache,target=/app/node_modules/.cache turbo build --filter=web

################################################################################

FROM base AS runner
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Copy Prisma schema, migrations and all dependencies for runtime migration deployment
COPY --from=installer --chown=nextjs:nodejs /app/packages-answers/db/prisma ./packages-answers/db/prisma
COPY --from=installer --chown=nextjs:nodejs /app/packages-answers/db/node_modules ./packages-answers/db/node_modules

# Copy the pnpm store to resolve symlinks
# Probably needs to be optimized and reconsidered
COPY --from=installer --chown=nextjs:nodejs /app/node_modules/.pnpm ./node_modules/.pnpm

# Copy generated Prisma client for runtime
COPY --from=installer --chown=nextjs:nodejs /app/packages-answers/db/generated ./packages-answers/db/generated

# Copy root package.json and pnpm-lock.yaml for db:migrate script
COPY --from=installer --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=installer --chown=nextjs:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Copy entrypoint.sh script
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/entrypoint.sh ./entrypoint.sh

# Update permissions for entrypoint.sh
RUN chmod +x entrypoint.sh

USER nextjs

# Build arguments for port configuration
ARG PORT=3000
ENV PORT=$PORT

EXPOSE $PORT

ENV NUMBER_OF_PROXIES="1"

ENV HOSTNAME="0.0.0.0"

# Use Node.js entrypoint to parse DATABASE_SECRET, run migration, and start server
CMD ["sh", "entrypoint.sh"]
