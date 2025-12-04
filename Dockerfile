# Wall Photo Display - Dockerfile
# 多阶段构建：构建前端 + 运行时环境

# ============================================
# 阶段1：构建前端资源
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装所有依赖（包括 devDependencies 用于构建）
RUN npm ci

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# ============================================
# 阶段2：生产运行时
# ============================================
FROM node:20-alpine AS runtime

# 安装 better-sqlite3 编译所需的依赖
RUN apk add --no-cache python3 make g++

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 仅安装生产依赖
RUN npm ci --only=production && \
    npm cache clean --force

# 从构建阶段复制前端资源
COPY --from=builder /app/dist ./dist

# 复制服务端代码
COPY server ./server

# 复制公共资源
COPY public ./public

# 创建数据目录
RUN mkdir -p /app/data/uploads

# 设置环境变量
ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/app/data/photowall.db \
    UPLOAD_PATH=/app/data/uploads

# 暴露端口
EXPOSE 3000

# 数据卷 - 持久化数据库和上传文件
VOLUME ["/app/data"]

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/tags || exit 1

# 启动命令
CMD ["node", "server/index.ts"]
