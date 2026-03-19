# ---- Build Stage ----
FROM node:22 AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Build frontend (Vue) and backend (TypeScript)
RUN npm run build:all

# Prepare production node_modules in a separate directory
RUN mkdir /app/prod_modules \
    && cp package.json package-lock.json* /app/prod_modules/ \
    && cd /app/prod_modules \
    && npm ci --omit=dev


# ---- Production Stage ----
FROM node:22-slim

WORKDIR /app

RUN apt-get update && apt-get install -y tini --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy production node_modules from builder
COPY --from=builder /app/prod_modules/node_modules ./node_modules

# Copy built frontend assets and server
COPY --from=builder /app/dist ./dist

# Copy public assets and package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./

# Data directory will be mounted as volume
RUN mkdir -p /app/data/uploads

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/photowall.db
ENV UPLOAD_PATH=/app/data/uploads

EXPOSE 3000

VOLUME ["/app/data"]

ENTRYPOINT ["tini", "--"]
CMD ["node", "dist/server/index.js"]
