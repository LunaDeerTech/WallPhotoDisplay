# Wall Photo Display 🖼️

多用户照片墙系统 - 基于 Vue 3 + Express.js 的渐进式网页应用（PWA）

![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?logo=vue.js)
![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?logo=express)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ 功能特性

- 📸 **瀑布流照片展示** - 响应式瀑布流布局，支持自定义列数
- 🏷️ **标签管理** - 灵活的标签系统，支持按标签筛选照片
- 👥 **多用户支持** - 用户注册、登录，管理员权限控制
- 🎨 **主题定制** - 支持明/暗主题切换，可跟随系统
- 📱 **PWA 支持** - 可安装为桌面/移动应用，支持离线访问
- 🖱️ **丰富的交互** - 右键菜单、批量操作、图片放大预览
- 📤 **便捷上传** - 支持拖拽上传，自动生成缩略图

## 📷 截图预览

![](images/main-view.png)
![](images/view-setting.png)
![](images/tag-edit.png)
![](images/upload-photos.png)

## 🛠️ 技术栈

| 层级 | 技术选型 |
|------|----------|
| 前端框架 | Vue 3 + Vite + TypeScript |
| 状态管理 | Pinia |
| HTTP 客户端 | Axios |
| 后端框架 | Express.js + TypeScript |
| 数据库 | SQLite (better-sqlite3) |
| 认证 | JWT (jsonwebtoken) |
| 文件上传 | Multer |
| 图片处理 | Sharp |
| PWA | vite-plugin-pwa |

## 📦 项目结构

```
wall-photo-display/
├── server/              # Express.js 后端
│   ├── routes/          # API 路由
│   ├── controllers/     # 业务逻辑
│   ├── models/          # 数据模型
│   ├── middleware/      # 中间件 (认证、上传)
│   └── config/          # 配置文件
├── src/                 # Vue 3 前端
│   ├── api/             # API 接口封装
│   ├── stores/          # Pinia 状态管理
│   ├── components/      # Vue 组件
│   │   ├── layout/      # 布局组件
│   │   ├── photo/       # 照片相关组件
│   │   ├── dialogs/     # 弹窗组件
│   │   └── common/      # 通用组件
│   ├── composables/     # 组合式函数
│   ├── styles/          # 样式文件
│   └── utils/           # 工具函数
├── uploads/photos/      # 用户上传的图片
└── data/                # SQLite 数据库文件
```

## 🚀 快速开始

### 环境要求

- **Node.js** 18.x 或更高版本（推荐 20.x LTS）
- **npm** 9.x 或更高版本

### 安装步骤

1. **克隆仓库**

```bash
git clone https://github.com/LunaDeerTech/WallPhotoDisplay.git
cd WallPhotoDisplay
```

2. **安装依赖**

```bash
npm install
```

3. **配置环境变量**

创建 `.env` 文件：

```env
# 服务器配置
PORT=3000

# JWT 密钥（请修改为随机字符串）
JWT_SECRET=your-super-secret-jwt-key

# 数据库路径
DB_PATH=./data/photowall.db

# 上传文件路径
UPLOAD_PATH=./data/uploads
```

4. **初始化数据库**

```bash
npm run init-db
```

这将创建数据库表并生成默认管理员账户：
- 用户名：`admin`
- 密码：`admin123`

> ⚠️ 请在首次登录后立即修改默认密码！

5. **启动开发服务器**

```bash
npm run dev
```

访问 http://localhost:5173 即可使用。

### 生产部署

1. **构建前后端**

```bash
npm run build
npm run build:server
```

2. **启动生产服务器**

```bash
npm run start
```

服务将在 http://localhost:3000 启动。

## 🐳 Docker 部署


### 构建镜像

```bash
docker build -t wall-photo-display .
```

### 使用 Docker Compose 启动

```bash
docker-compose up -d
```

### 手动运行容器

```bash
# 运行容器
docker run -d \
  -p 3000:3000 \
  -v ./data:/app/data \
  -e DB_PATH=/app/data/photowall.db \
  -e UPLOAD_PATH=/app/data/uploads \
  -e JWT_SECRET=your-secret-key \
  -e NODE_ENV=production \
  wall-photo-display:latest
```

