# ============================================
# Wall Photo Display - Production Dockerfile
# Multi-stage build for optimized image size
# ============================================

# Stage 1: Build frontend and backend
FROM node:20-alpine AS builder

# Install build dependencies for native modules (sharp, better-sqlite3, bcrypt)
RUN apk add --no-cache python3 make g++ vips-dev

WORKDIR /app

# Copy package files first for better cache
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build frontend (Vue + Vite) and backend (TypeScript)
RUN npm run build:all

# ============================================
# Stage 2: Production runtime
FROM node:20-alpine AS production

# Install runtime dependencies for native modules
RUN apk add --no-cache vips-dev

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S photowall -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Create directories for data persistence
RUN mkdir -p data/uploads && chown -R photowall:nodejs data

# Switch to non-root user
USER photowall

# Expose port
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the application (npm run start)
CMD ["npm", "run", "start"]
