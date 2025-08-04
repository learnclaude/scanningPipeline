# Multi-stage Dockerfile for Next.js application - Enterprise Grade
# Optimized for security, performance, and minimal image size

# Base stage with common dependencies
FROM node:18-alpine AS base

# Accept build arguments for user/group IDs
ARG USER_ID=1001
ARG GROUP_ID=1001

RUN apk add --no-cache libc6-compat
WORKDIR /app
# Install security updates
RUN apk update && apk upgrade

# Dependencies stage - install production dependencies
FROM base AS deps
# Copy package files
COPY package.json package-lock.json* ./
# Clean install production dependencies with cache mount for faster builds
# Skip prepare scripts since husky is not needed in production
RUN --mount=type=cache,target=/root/.npm \
    npm_config_ignore_scripts=true npm ci --only=production

# Dev dependencies stage - install all dependencies for building
FROM base AS dev-deps
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Builder stage - build the application
FROM base AS builder
WORKDIR /app
# Copy dependencies from dev-deps stage
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .

# Set build arguments for different environments
ARG NODE_ENV=production
ARG NEXT_PUBLIC_API_URL
ARG BUILD_ID
ARG BUILD_DATE
ARG VCS_REF

# Set environment variables for build
ENV NODE_ENV=$NODE_ENV
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_BUILD_ID=$BUILD_ID

# Build the application with standalone output
RUN npm run build

# Production runner stage
FROM base AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Add labels for container metadata
LABEL org.opencontainers.image.title="Filename Generator" \
      org.opencontainers.image.description="Enterprise Next.js Filename Generator Application" \
      org.opencontainers.image.version="$BUILD_ID" \
      org.opencontainers.image.created="$BUILD_DATE" \
      org.opencontainers.image.revision="$VCS_REF" \
      org.opencontainers.image.vendor="Your Company" \
      org.opencontainers.image.licenses="MIT"

# Create non-root user with configurable UID/GID for better security
RUN addgroup -g ${GROUP_ID} -S nodejs 2>/dev/null || addgroup -S nodejs && \
    adduser -u ${USER_ID} -S nextjs -G nodejs 2>/dev/null || adduser -S nextjs -G nodejs

# Copy production dependencies
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy built application with proper ownership
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy package.json for health checks
COPY --chown=nextjs:nodejs package.json ./

# Create writable directories for Next.js
RUN mkdir -p .next/cache && chown -R nextjs:nodejs .next

# Install curl for health checks
RUN apk add --no-cache curl

# Set up health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set port environment variable
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use node directly for better signal handling
CMD ["node", "server.js"]