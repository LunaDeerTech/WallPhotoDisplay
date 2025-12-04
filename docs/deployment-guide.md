# Wall Photo Display 部署手册

本文档详细介绍如何通过源码部署 Wall Photo Display 照片墙系统。

## 目录

- [环境要求](#环境要求)
- [获取源码](#获取源码)
- [安装依赖](#安装依赖)
- [配置环境变量](#配置环境变量)
- [初始化数据库](#初始化数据库)
- [构建前端](#构建前端)
- [启动服务](#启动服务)
- [生产环境部署](#生产环境部署)
- [Docker 部署](#docker-部署)
- [常见问题](#常见问题)

---

## 环境要求

### 必需软件

| 软件 | 最低版本 | 推荐版本 | 说明 |
|------|----------|----------|------|
| Node.js | 18.x | 20.x LTS | JavaScript 运行环境 |
| npm | 9.x | 10.x | 包管理器（随 Node.js 安装） |
| Git | 2.x | 最新版 | 版本控制工具 |

### 系统要求

- **操作系统**：Windows 10+、macOS 10.15+、Ubuntu 20.04+ 或其他主流 Linux 发行版
- **内存**：最低 1GB，推荐 2GB+
- **磁盘空间**：至少 500MB（不含上传的图片）

### 验证环境

```bash
# 检查 Node.js 版本
node --version

# 检查 npm 版本
npm --version

# 检查 Git 版本
git --version
```

---

## 获取源码

### 方式一：通过 Git 克隆（推荐）

```bash
# 克隆仓库
git clone https://github.com/LunaDeerTech/WallPhotoDisplay.git

# 进入项目目录
cd WallPhotoDisplay
```

### 方式二：下载 ZIP 压缩包

1. 访问 [GitHub 仓库](https://github.com/LunaDeerTech/WallPhotoDisplay)
2. 点击 `Code` → `Download ZIP`
3. 解压到目标目录
4. 进入解压后的目录

---

## 安装依赖

在项目根目录执行：

```bash
npm install
```

> **注意**：`better-sqlite3` 包含原生模块，安装时需要编译。
> - **Windows**：需要安装 [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)（勾选 "Desktop development with C++"）
> - **macOS**：需要安装 Xcode Command Line Tools（`xcode-select --install`）
> - **Linux**：需要安装 build-essential（`sudo apt install build-essential`）

安装成功后，会看到类似输出：

```
added xxx packages in xxs
```

---

## 配置环境变量

### 创建配置文件

在项目根目录创建 `.env` 文件：

```bash
# Windows (PowerShell)
New-Item -Path ".env" -ItemType File

# Linux / macOS
touch .env
```

### 配置项说明

编辑 `.env` 文件，根据需要配置以下环境变量：

```env
# 服务端口（默认: 3000）
PORT=3000

# 运行环境（development | production）
NODE_ENV=production

# JWT 密钥（生产环境必须修改！）
# 建议使用长随机字符串，可通过以下命令生成：
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-super-secret-jwt-key-change-me-in-production

# JWT 过期时间（默认: 7d）
JWT_EXPIRES_IN=7d

# 数据库文件路径（默认: ./data/photowall.db）
DB_PATH=./data/photowall.db

# 上传文件存储路径（默认: ./data/uploads）
UPLOAD_PATH=./data/uploads
```

### 生产环境安全建议

1. **必须** 修改 `JWT_SECRET` 为强随机字符串
2. **建议** 将 `NODE_ENV` 设置为 `production`
3. **建议** 配置独立的数据存储目录，便于备份

---

## 初始化数据库

首次部署时，需要初始化数据库：

```bash
npm run init-db
```

成功输出示例：

```
数据库文件目录: /path/to/data
✓ 创建 data 目录
✓ 创建 uploads 目录

开始初始化数据库...

✓ 数据库表结构创建成功
✓ 默认管理员账号创建成功
  用户名: admin
  密码: admin123

  ⚠️  请在首次登录后立即修改密码！

数据库初始化完成！
```

> **重要**：首次登录后请立即修改默认管理员密码！

---

## 构建前端

构建 Vue 前端资源：

```bash
npm run build
```

构建成功后，会在项目根目录生成 `dist/` 文件夹，包含所有静态资源。

构建输出示例：

```
vite v5.x.x building for production...
✓ xxx modules transformed.
dist/index.html                   x.xx kB │ gzip: x.xx kB
dist/assets/index-xxx.css         x.xx kB │ gzip: x.xx kB
dist/assets/index-xxx.js          x.xx kB │ gzip: x.xx kB
✓ built in xxxms
```

---

## 启动服务

### 生产模式启动

```bash
npm run start
```

服务启动后，访问 `http://localhost:3000`（或配置的端口）即可使用。

## 生产环境部署

### 方式一：使用 PM2 进程管理

[PM2](https://pm2.keymetrics.io/) 是 Node.js 生产环境推荐的进程管理器。

#### 安装 PM2

```bash
npm install -g pm2
```

#### 创建 PM2 配置文件

在项目根目录创建 `ecosystem.config.cjs`：

```javascript
module.exports = {
  apps: [{
    name: 'wall-photo-display',
    script: 'server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

#### PM2 常用命令

```bash
# 启动应用
pm2 start ecosystem.config.cjs

# 查看状态
pm2 status

# 查看日志
pm2 logs wall-photo-display

# 重启应用
pm2 restart wall-photo-display

# 停止应用
pm2 stop wall-photo-display

# 删除应用
pm2 delete wall-photo-display

# 设置开机自启
pm2 startup
pm2 save
```

### 方式二：Nginx 反向代理

推荐使用 Nginx 作为反向代理，提供 HTTPS 和更好的性能。

#### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # HTTP 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL 证书配置
    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    
    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    
    # 文件上传大小限制（根据需要调整）
    client_max_body_size 50M;
    
    # 代理到 Node.js 应用
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 静态文件缓存（可选，提升性能）
    location /assets/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 7d;
        add_header Cache-Control "public, max-age=604800";
    }
    
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, max-age=2592000";
    }
}
```

---

## Docker 部署

Docker 部署是最简便的部署方式，无需手动安装 Node.js 和编译依赖。

### 前提条件

- 安装 [Docker](https://docs.docker.com/get-docker/)（20.10+）
- 安装 [Docker Compose](https://docs.docker.com/compose/install/)（可选，推荐）

### 方式一：使用 Docker Compose（推荐）

这是最简单的部署方式，一条命令即可启动。

#### 1. 获取源码

```bash
git clone https://github.com/LunaDeerTech/WallPhotoDisplay.git
cd WallPhotoDisplay
```

#### 2. 配置环境变量（可选）

创建 `.env` 文件设置 JWT 密钥：

```bash
# .env
JWT_SECRET=your-super-secret-jwt-key-change-me
JWT_EXPIRES_IN=7d
```

> **重要**：生产环境必须修改 `JWT_SECRET`！

#### 3. 启动服务

```bash
# 构建并启动（后台运行）
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

服务启动后访问 `http://localhost:3000`。

#### 4. 初始化数据库

首次启动后，需要初始化数据库创建管理员账号：

```bash
docker-compose exec photowall node server/scripts/initDatabase.js
```

### 方式二：直接使用 Docker

#### 1. 构建镜像

```bash
# 在项目根目录执行
docker build -t wall-photo-display:latest .
```

#### 2. 运行容器

```bash
docker run -d \
  --name wall-photo-display \
  -p 3000:3000 \
  -v photowall-data:/app/data \
  -e JWT_SECRET=your-super-secret-jwt-key \
  -e NODE_ENV=production \
  --restart unless-stopped \
  wall-photo-display:latest
```

#### 3. 初始化数据库

```bash
docker exec wall-photo-display node server/scripts/initDatabase.js
```

### Docker 常用命令

```bash
# 查看容器状态
docker ps

# 查看日志
docker logs -f wall-photo-display

# 进入容器
docker exec -it wall-photo-display sh

# 重启容器
docker restart wall-photo-display

# 停止并删除容器
docker stop wall-photo-display
docker rm wall-photo-display
```

### 数据持久化

Docker 部署使用命名卷 `photowall-data` 存储数据，包括：
- SQLite 数据库文件
- 用户上传的图片

#### 备份数据卷

```bash
# 备份到本地目录
docker run --rm \
  -v photowall-data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/photowall-backup.tar.gz -C /data .
```

#### 恢复数据卷

```bash
# 从备份恢复
docker run --rm \
  -v photowall-data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar xzf /backup/photowall-backup.tar.gz -C /data
```

### 使用外部数据目录

如果想直接映射本地目录而不是使用 Docker 卷：

```bash
# 创建本地数据目录
mkdir -p ./mydata/uploads

# 运行容器，映射本地目录
docker run -d \
  --name wall-photo-display \
  -p 3000:3000 \
  -v $(pwd)/mydata:/app/data \
  -e JWT_SECRET=your-secret-key \
  wall-photo-display:latest
```

### 与 Nginx 配合使用

如果使用 Nginx 反向代理，可以创建 Docker 网络：

```yaml
# docker-compose.yml 示例（带 Nginx）
services:
  photowall:
    build: .
    container_name: wall-photo-display
    restart: unless-stopped
    volumes:
      - photowall-data:/app/data
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
    networks:
      - webnet

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - photowall
    networks:
      - webnet

networks:
  webnet:

volumes:
  photowall-data:
```

---

## 数据备份与恢复

### 备份数据

需要备份的文件：

1. **数据库文件**：`data/photowall.db`（及 `.db-wal`、`.db-shm` 文件）
2. **上传的图片**：`data/uploads/` 目录
3. **环境配置**：`.env` 文件

#### 备份脚本示例

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/path/to/backup"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/path/to/WallPhotoDisplay"

# 创建备份目录
mkdir -p "$BACKUP_DIR/$DATE"

# 备份数据库
cp "$APP_DIR/data/photowall.db"* "$BACKUP_DIR/$DATE/"

# 备份上传文件
tar -czvf "$BACKUP_DIR/$DATE/uploads.tar.gz" -C "$APP_DIR/data" uploads

# 备份配置文件
cp "$APP_DIR/.env" "$BACKUP_DIR/$DATE/"

echo "备份完成: $BACKUP_DIR/$DATE"
```

### 恢复数据

1. 停止应用服务
2. 恢复数据库文件到 `data/` 目录
3. 恢复上传文件到 `data/uploads/` 目录
4. 恢复 `.env` 配置文件
5. 重启应用服务

---

## 更新升级

### 更新步骤

```bash
# 1. 停止服务
pm2 stop wall-photo-display

# 2. 备份数据（重要！）
# 执行备份脚本或手动备份

# 3. 拉取最新代码
git pull origin main

# 4. 更新依赖
npm install

# 5. 重新构建前端
npm run build

# 6. 启动服务
pm2 start wall-photo-display
```

---

## 常见问题

### Q: 安装依赖时 `better-sqlite3` 编译失败

**A**: 确保已安装 C++ 编译工具：
- Windows: 安装 Visual Studio Build Tools
- macOS: 运行 `xcode-select --install`
- Linux: 运行 `sudo apt install build-essential python3`

如果仍然失败，尝试：
```bash
npm rebuild better-sqlite3
```

### Q: 启动时提示端口被占用

**A**: 修改 `.env` 文件中的 `PORT` 为其他端口，或停止占用该端口的进程：

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux / macOS
lsof -i :3000
kill -9 <PID>
```

### Q: 上传图片失败

**A**: 检查以下几点：
1. `data/uploads/` 目录是否存在且有写入权限
2. 检查 `.env` 中 `UPLOAD_PATH` 配置是否正确
3. 如果使用 Nginx，检查 `client_max_body_size` 配置

### Q: 如何重置管理员密码

**A**: 目前需要直接操作数据库，或删除数据库重新初始化：

```bash
# 方法1：删除数据库重新初始化（会丢失所有数据！）
rm data/photowall.db*
npm run init-db

# 方法2：使用 sqlite3 命令行工具修改（需要生成新的 bcrypt 哈希）
```

### Q: 如何修改默认管理员账号

**A**: 编辑 `server/scripts/initDatabase.js` 文件中的 `defaultAdmin` 对象，然后重新运行初始化脚本。

---

## 目录结构说明

```
WallPhotoDisplay/
├── data/                   # 数据目录（自动创建）
│   ├── photowall.db        # SQLite 数据库
│   └── uploads/            # 上传的图片
├── dist/                   # 前端构建输出（自动生成）
├── server/                 # 后端代码
│   ├── config/             # 配置文件
│   ├── controllers/        # 控制器
│   ├── middleware/         # 中间件
│   ├── models/             # 数据模型
│   ├── routes/             # API 路由
│   └── scripts/            # 脚本
├── src/                    # 前端源码
├── .env                    # 环境变量配置（需手动创建）
└── package.json            # 项目配置
```

---

## 技术支持

如有问题，请通过以下方式获取帮助：

- **GitHub Issues**: [提交 Issue](https://github.com/LunaDeerTech/WallPhotoDisplay/issues)
- **项目文档**: 查看 `guidelines-claude-opus.md` 获取更多技术细节
