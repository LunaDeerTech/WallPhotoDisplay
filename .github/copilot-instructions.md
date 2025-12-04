# Wall Photo Display - AI Coding Instructions

## Project Overview

Wall Photo Display is a multi-user photo wall PWA (Progressive Web App) with Vue 3 frontend and Express.js backend, using SQLite for data storage. See `guidelines-claude-opus.md` for complete specifications.

## Main Styles

整体风格设计采用类似 iOS 的简洁风格，配色以蓝色为主色调，辅以白色和浅灰色。按钮、输入框等交互元素采用圆角设计，悬浮和点击时有轻微阴影效果。整体界面注重留白，避免过度拥挤。

## 页面布局、设计、交互逻辑

### 左侧边栏
从上往下依次是 浏览设置、管理图片、个人信息、用户管理。其中在未登录时仅 浏览设置 可见，登陆后才会显示 管理图片、个人信息，登陆的是管理员账号则会再增加一个用户管理。按钮点击后通过浮窗的方式展示各按钮内容。
如果是移动端则改为底部导航栏，图标大小适当增大。

### 主内容区域
以瀑布流展示图片，栏数、要展示的图片分类根据 浏览设置 中选择的内容决定。点击图片可以放大显示。右键图片可以弹出菜单：放大、下载。如果是自己上传的图片，菜单则额外显示：编辑标签、删除。对于管理员，所有图片都可以编辑或删除，因此菜单中额外增加一个 多选。编辑标签采用弹出式窗口。

### 编辑标签窗口
文本输入框，标签以井号开头空格结尾算一个标签，输入框下方随机展示一部分当前可用的标签，点击选择。当输入的标签不存在时，则自动创建新标签。窗口底部有 保存、取消 按钮。

### 浏览设置窗口
可以选择主内容区瀑布流栏数量、选择要展示的标签（搜索选择，逻辑大致如上编辑标签窗口的标签选择方式但是此处不需要额外的标签选择窗口）、界面颜色主题（明、暗、跟随系统、颜色）、图片排序方式

### 管理图片窗口
管理自己上传的图片，窗口最上方一排依次是 上传图片、分类、多选。点击上传图片后选择本地图片上传或者直接拖动图片到窗口上传。通过分类可以按标签筛选图片。左键图片可以放大查看，右键图片弹出菜单：多选、编辑标签（显示编辑标签窗口）、删除。进入多选模式后原先的多选按钮变为 编辑标签（显示编辑标签窗口）、删除，多选模式下右键任意一张图片显示菜单 批量编辑、批量删除。

### 个人信息窗口
修改账号显示名称、密码。

### 用户管理窗口
以列表显示所有用户，可以添加、删除用户，修改用户密码。用户以账号为登录凭证，账号创建后不可修改。

## Architecture

```
wall-photo-display/
├── server/          # Express.js backend (API + static serving)
│   ├── routes/      # API endpoints: auth, users, photos, tags
│   ├── controllers/ # Business logic
│   ├── models/      # SQLite data models (better-sqlite3)
│   └── middleware/  # JWT auth, multer file upload
├── src/             # Vue 3 frontend
│   ├── api/         # Axios API clients
│   ├── stores/      # Pinia stores: auth, settings, photos
│   ├── components/  # Vue components (layout/, photo/, dialogs/, common/)
│   └── composables/ # useTheme, useContextMenu, useMultiSelect
└── uploads/photos/  # User-uploaded images
```

## Tech Stack & Key Patterns

### Backend (Express.js)
- **Database**: SQLite via `better-sqlite3` (synchronous API)
- **Auth**: JWT tokens (`jsonwebtoken`), passwords hashed with `bcrypt`
- **File uploads**: `multer` with UUID filenames, 10MB limit
- **Image processing**: `sharp` for thumbnails
- **Roles**: `admin` | `user` - admin manages users, both can upload

### Frontend (Vue 3 + Vite)
- **State**: Pinia stores - `authStore`, `settingsStore`, `photosStore`
- **HTTP**: Axios with JWT interceptor (`src/utils/request.js`)
- **Styling**: CSS variables for theming (`--color-*`), support for light/dark/system/custom
- **PWA**: `vite-plugin-pwa` with CacheFirst for images, NetworkFirst for API

## API Conventions

All endpoints return consistent response format:
```typescript
{ success: boolean, data?: T, error?: string }
```

Key endpoints:
- `POST /api/auth/login` - Returns JWT token
- `GET /api/photos?tags=&sort=&page=&limit=` - Paginated photo list
- `POST /api/photos` - Multipart upload with optional `#tag` syntax
- `PUT /api/photos/:id/tags` - Update tags array
- `DELETE /api/photos/batch` - Bulk delete

## Component Patterns

### Dialog Components (`src/components/dialogs/`)
- Modal-based, controlled by parent via v-model
- Use `Modal.vue` wrapper for consistent styling

### Photo Components
- `PhotoWaterfall.vue`: CSS Grid + JS positioning for true masonry
- `PhotoCard.vue`: Supports selection mode for bulk operations
- `PhotoContextMenu.vue`: Context-sensitive actions based on auth role

### Tag Input
- Parse tags with `#` prefix: `#风景 #夏天` → `['风景', '夏天']`
- Use `TagInput.vue` for creation, `TagSelector.vue` for filtering

## Development Commands

```bash
npm run dev          # Concurrent server + Vite dev
npm run dev:server   # Express only (nodemon)
npm run dev:client   # Vite only
npm run build        # Production build
npm run start        # Production server (serves dist/)
npm run init-db      # Initialize SQLite + default admin
```

## Database Schema

Four tables: `users`, `photos`, `tags`, `photo_tags` (junction)
- Foreign keys with CASCADE delete
- Username is immutable, display_name is editable
- Photo filename is UUID, original_name preserved

## Important Implementation Notes

1. **Auth middleware order**: Apply `authMiddleware` before `adminMiddleware`
2. **File paths**: Store relative paths in DB, serve via `/uploads/` static route
3. **Theme persistence**: Store in `localStorage`, apply via `data-theme` attribute on `<html>`
4. **Waterfall recalc**: Trigger on window resize and column count change
5. **Batch operations**: Verify ownership of ALL items before processing
