# Guidelines - Claude Opus

# 照片墙系统 Wall Photo Display 项目计划书

## 1. 项目概述

### 1.1 项目名称

**Wall Photo Display** - 多用户照片墙系统

### 1.2 项目简介

一个基于 Node.js + Vue.js 的渐进式网页应用（PWA），提供照片展示、标签管理和多用户支持功能。采用前后端一体化部署方式，简化部署流程。

### 1.3 技术栈

| 层级 | 技术选型 |
|----|----|
| 前端框架 | Vue 3 + Vite |
| UI 组件 | 自定义组件 + CSS 变量主题系统 |
| 状态管理 | Pinia |
| 后端框架 | Express.js |
| 数据库 | SQLite (通过 better-sqlite3) |
| 文件存储 | 本地文件系统 |
| 认证 | JWT (jsonwebtoken) |
| PWA | vite-plugin-pwa |

### 1.4 项目结构

```
wall-photo-display/
├── package.json
├── vite.config. js
├── server/
│   ├── index.js                 # 服务入口
│   ├── config/
│   │   └── database. js          # 数据库配置
│   ├── middleware/
│   │   ├── auth.js              # JWT 认证中间件
│   │   └── upload.js            # 文件上传中间件 (multer)
│   ├── routes/
│   │   ├── auth.js              # 认证路由
│   │   ├── users.js             # 用户管理路由
│   │   ├── photos.js            # 图片管理路由
│   │   └── tags.js              # 标签管理路由
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController. js
│   │   ├── photoController.js
│   │   └── tagController.js
│   └── models/
│       ├── User.js
│       ├── Photo.js
│       └── Tag.js
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── registerServiceWorker.js
│   ├── api/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── photos.js
│   │   └── tags.js
│   ├── stores/
│   │   ├── auth.js              # 用户认证状态
│   │   ├── settings.js          # 浏览设置状态
│   │   └── photos.js            # 图片数据状态
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.vue
│   │   │   └── MainContent.vue
│   │   ├── photo/
│   │   │   ├── PhotoWaterfall.vue
│   │   │   ├── PhotoCard. vue
│   │   │   ├── PhotoViewer.vue
│   │   │   └── PhotoContextMenu.vue
│   │   ├── dialogs/
│   │   │   ├── BrowseSettingsDialog.vue
│   │   │   ├── PhotoManageDialog.vue
│   │   │   ├── ProfileDialog.vue
│   │   │   ├── UserManageDialog.vue
│   │   │   ├── TagEditDialog.vue
│   │   │   ├── LoginDialog.vue
│   │   │   └── ImageUploadDialog.vue
│   │   └── common/
│   │       ├── TagInput.vue
│   │       ├── TagSelector.vue
│   │       ├── Modal.vue
│   │       └── ContextMenu.vue
│   ├── composables/
│   │   ├── useTheme.js
│   │   ├── useContextMenu.js
│   │   └── useMultiSelect.js
│   ├── styles/
│   │   ├── variables.css        # CSS 变量定义
│   │   ├── themes.css           # 主题样式
│   │   └── global. css
│   └── utils/
│       ├── request.js           # Axios 封装
│       └── helpers.js
├── public/
│   ├── manifest.json            # PWA 配置
│   └── icons/                   # PWA 图标
└── uploads/                     # 图片存储目录
    └── photos/
```


---

## 2.  数据库设计

### 2.1 ER 图

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│   users     │       │  photo_tags     │       │    tags     │
├─────────────┤       ├─────────────────┤       ├─────────────┤
│ id (PK)     │       │ photo_id (FK)   │───────│ id (PK)     │
│ username    │       │ tag_id (FK)     │       │ name        │
│ password    │       └─────────────────┘       │ created_at  │
│ display_name│               │                 └─────────────┘
│ role        │               │
│ created_at  │               │
│ updated_at  │       ┌───────┴───────┐
└──────┬──────┘       │               │
       │              │               │
       │       ┌──────┴──────┐        │
       └───────│   photos    │────────┘
               ├─────────────┤
               │ id (PK)     │
               │ user_id(FK) │
               │ filename    │
               │ original_name│
               │ file_path   │
               │ file_size   │
               │ mime_type   │
               │ width       │
               │ height      │
               │ created_at  │
               │ updated_at  │
               └─────────────┘
```

### 2.2 表结构定义

#### users 表

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,      -- 登录账号，不可修改
    password VARCHAR(255) NOT NULL,             -- bcrypt 加密存储
    display_name VARCHAR(100),                  -- 显示名称
    role VARCHAR(20) DEFAULT 'user',            -- 'admin' | 'user'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### photos 表

```sql
CREATE TABLE photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL,             -- 存储的文件名 (UUID)
    original_name VARCHAR(255),                 -- 原始文件名
    file_path VARCHAR(500) NOT NULL,            -- 相对存储路径
    file_size INTEGER,                          -- 文件大小 (bytes)
    mime_type VARCHAR(100),                     -- MIME 类型
    width INTEGER,                              -- 图片宽度
    height INTEGER,                             -- 图片高度
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### tags 表

```sql
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,          -- 标签名（不含#）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### photo_tags 表

```sql
CREATE TABLE photo_tags (
    photo_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (photo_id, tag_id),
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```


---

## 3.  API 接口设计

### 3. 1 认证模块 `/api/auth`

| 方法 | 路径 | 描述 | 权限 |
|----|----|----|----|
| POST | `/login` | 用户登录 | 公开 |
| POST | `/logout` | 用户登出 | 已登录 |
| GET | `/me` | 获取当前用户信息 | 已登录 |

#### 请求/响应示例

**POST /api/auth/login**

```json
// Request
{
    "username": "admin",
    "password": "password123"
}

// Response 200
{
    "success": true,
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIs...",
        "user": {
            "id": 1,
            "username": "admin",
            "displayName": "管理员",
            "role": "admin"
        }
    }
}
```

### 3.2 用户模块 `/api/users`

| 方法 | 路径 | 描述 | 权限 |
|----|----|----|----|
| GET | `/` | 获取所有用户列表 | 管理员 |
| POST | `/` | 创建新用户 | 管理员 |
| PUT | `/:id` | 更新用户信息 | 管理员/本人 |
| DELETE | `/:id` | 删除用户 | 管理员 |
| PUT | `/:id/password` | 修改密码 | 管理员/本人 |

#### 请求/响应示例

**POST /api/users**

```json
// Request
{
    "username": "newuser",
    "password": "password123",
    "displayName": "新用户",
    "role": "user"
}

// Response 201
{
    "success": true,
    "data": {
        "id": 2,
        "username": "newuser",
        "displayName": "新用户",
        "role": "user"
    }
}
```

**PUT /api/users/:id**

```json
// Request
{
    "displayName": "新的显示名"
}

// Response 200
{
    "success": true,
    "data": {
        "id": 2,
        "username": "newuser",
        "displayName": "新的显示名",
        "role": "user"
    }
}
```

### 3.3 图片模块 `/api/photos`

| 方法 | 路径 | 描述 | 权限 |
|----|----|----|----|
| GET | `/` | 获取图片列表（支持分页、筛选、排序） | 公开 |
| GET | `/:id` | 获取单张图片详情 | 公开 |
| POST | `/` | 上传图片 | 已登录 |
| PUT | `/:id/tags` | 更新图片标签 | 上传者/管理员 |
| DELETE | `/:id` | 删除图片 | 上传者/管理员 |
| DELETE | `/batch` | 批量删除图片 | 上传者/管理员 |
| PUT | `/batch/tags` | 批量更新标签 | 上传者/管理员 |
| GET | `/my` | 获取当前用户的图片 | 已登录 |

#### 请求/响应示例

**GET /api/photos**

```
Query Parameters:
- page: 页码 (default: 1)
- limit: 每页数量 (default: 20)
- tags: 标签筛选，逗号分隔
- sort: 排序方式 (created_at_desc | created_at_asc | random)
- userId: 用户筛选（管理员可用）
```

```json
// Response 200
{
    "success": true,
    "data": {
        "photos": [
            {
                "id": 1,
                "filename": "abc123.jpg",
                "originalName": "photo. jpg",
                "url": "/uploads/photos/abc123.jpg",
                "thumbnailUrl": "/uploads/photos/thumb_abc123.jpg",
                "width": 1920,
                "height": 1080,
                "userId": 1,
                "uploaderName": "管理员",
                "tags": ["风景", "夏天"],
                "createdAt": "2025-12-01T10:00:00Z"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 100,
            "totalPages": 5
        }
    }
}
```

**POST /api/photos**

```
Content-Type: multipart/form-data

Fields:
- photos: File[] (多文件上传)
- tags: string (可选，格式: "#标签1 #标签2")
```

**PUT /api/photos/:id/tags**

```json
// Request
{
    "tags": ["风景", "夏天", "海边"]
}

// Response 200
{
    "success": true,
    "data": {
        "id": 1,
        "tags": ["风景", "夏天", "海边"]
    }
}
```

### 3.4 标签模块 `/api/tags`

| 方法 | 路径 | 描述 | 权限 |
|----|----|----|----|
| GET | `/` | 获取所有标签 | 公开 |
| GET | `/random` | 随机获取标签 | 公开 |
| GET | `/search` | 搜索标签 | 公开 |

#### 请求/响应示例

**GET /api/tags**

```json
// Response 200
{
    "success": true,
    "data": [
        { "id": 1, "name": "风景", "count": 25 },
        { "id": 2, "name": "人物", "count": 18 }
    ]
}
```

**GET /api/tags/random? limit=10**

```json
// Response 200
{
    "success": true,
    "data": [
        { "id": 3, "name": "夏天", "count": 12 },
        { "id": 5, "name": "海边", "count": 8 }
    ]
}
```


---

## 4.  前端组件设计

### 4. 1 页面布局结构

```
┌────────────────────────────────────────────────────────┐
│                        App.vue                          │
├──────────┬─────────────────────────────────────────────┤
│          │                                              │
│ Sidebar  │              MainContent                     │
│          │         (PhotoWaterfall)                     │
│ ┌──────┐ │                                              │
│ │浏览  │ │    ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│ │设置  │ │    │     │ │     │ │     │ │     │          │
│ └──────┘ │    │Photo│ │Photo│ │Photo│ │Photo│          │
│ ┌──────┐ │    │Card │ │Card │ │Card │ │Card │          │
│ │管理  │ │    │     │ │     │ │     │ │     │          │
│ │图片  │ │    └─────┘ └─────┘ └─────┘ └─────┘          │
│ └──────┘ │    ┌─────┐ ┌─────┐ ┌─────┐                   │
│ ┌──────┐ │    │     │ │     │ │     │                   │
│ │个人  │ │    │Photo│ │Photo│ │Photo│                   │
│ │信息  │ │    │Card │ │Card │ │Card │                   │
│ └──────┘ │    │     │ │     │ │     │                   │
│ ┌──────┐ │    └─────┘ └─────┘ └─────┘                   │
│ │用户  │ │                                              │
│ │管理  │ │                                              │
│ └──────┘ │                                              │
│          │                                              │
└──────────┴─────────────────────────────────────────────┘
```

### 4. 2 组件层级关系

```
App.vue
├── Sidebar.vue
│   ├── SidebarButton (浏览设置) → BrowseSettingsDialog.vue
│   ├── SidebarButton (管理图片) → PhotoManageDialog. vue
│   │                              ├── ImageUploadDialog.vue
│   │                              └── TagEditDialog.vue
│   ├── SidebarButton (个人信息) → ProfileDialog.vue
│   └── SidebarButton (用户管理) → UserManageDialog. vue [admin only]
│
├── MainContent. vue
│   └── PhotoWaterfall.vue
│       ├── PhotoCard. vue
│       │   └── PhotoContextMenu.vue
│       └── PhotoViewer. vue (放大查看)
│
├── LoginDialog.vue (全局登录弹窗)
│
└── TagEditDialog.vue (全局标签编辑弹窗)
    ├── TagInput.vue
    └── TagSelector.vue
```

### 4.3 核心组件规格

#### Sidebar. vue

```typescript
// Props
interface SidebarProps {
    // 无
}

// Emits
interface SidebarEmits {
    'open-dialog': (dialogName: DialogType) => void
}

type DialogType = 'browse-settings' | 'photo-manage' | 'profile' | 'user-manage'

// 内部状态
// - 根据 authStore. isLoggedIn 控制菜单项显示
// - 根据 authStore.isAdmin 控制"用户管理"显示
```

#### PhotoWaterfall.vue

```typescript
// Props
interface PhotoWaterfallProps {
    columns: number           // 瀑布流列数
    photos: Photo[]          // 图片列表
    loading: boolean         // 加载状态
}

// Emits
interface PhotoWaterfallEmits {
    'load-more': () => void  // 触底加载更多
    'photo-click': (photo: Photo) => void
    'photo-contextmenu': (event: MouseEvent, photo: Photo) => void
}
```

#### PhotoCard.vue

```typescript
// Props
interface PhotoCardProps {
    photo: Photo
    selectable: boolean      // 是否可多选
    selected: boolean        // 是否已选中
}

// Emits
interface PhotoCardEmits {
    'click': (photo: Photo) => void
    'contextmenu': (event: MouseEvent, photo: Photo) => void
    'select': (photo: Photo, selected: boolean) => void
}
```

#### TagInput.vue

```typescript
// Props
interface TagInputProps {
    modelValue: string[]     // 当前标签列表
    placeholder?: string
}

// Emits
interface TagInputEmits {
    'update:modelValue': (tags: string[]) => void
}

// 功能说明
// - 输入 #标签名 + 空格 自动识别为一个标签
// - 支持删除标签
// - 防止重复标签
```

#### TagSelector.vue

```typescript
// Props
interface TagSelectorProps {
    selectedTags: string[]   // 已选择的标签
    limit?: number           // 显示数量限制
}

// Emits
interface TagSelectorEmits {
    'select': (tag: string) => void
}

// 功能说明
// - 随机展示可用标签
// - 点击标签触发 select 事件
// - 已选择的标签显示不同样式
```

#### BrowseSettingsDialog.vue

```typescript
// 设置项
interface BrowseSettings {
    columns: 2 | 3 | 4 | 5 | 6      // 瀑布流列数
    selectedTags: string[]          // 筛选标签
    theme: 'light' | 'dark' | 'system' | string  // 主题
    sortBy: 'created_at_desc' | 'created_at_asc' | 'random'  // 排序
}
```

#### PhotoManageDialog.vue

```typescript
// 状态
interface PhotoManageState {
    mode: 'normal' | 'multiselect'  // 操作模式
    selectedPhotos: Photo[]         // 多选时已选图片
    filterTags: string[]            // 筛选标签
}

// 功能
// - 上传图片（单个/批量，支持拖拽）
// - 图片列表展示（支持按标签筛选）
// - 单张图片操作：放大、编辑标签、删除
// - 多选操作：批量编辑标签、批量删除
```

### 4.4 状态管理 (Pinia Stores)

#### authStore

```typescript
interface AuthState {
    token: string | null
    user: User | null
}

interface AuthGetters {
    isLoggedIn: boolean
    isAdmin: boolean
    currentUserId: number | null
}

interface AuthActions {
    login(username: string, password: string): Promise<void>
    logout(): Promise<void>
    fetchCurrentUser(): Promise<void>
    updateProfile(data: UpdateProfileData): Promise<void>
    updatePassword(oldPassword: string, newPassword: string): Promise<void>
}
```

#### settingsStore

```typescript
interface SettingsState {
    columns: number
    selectedTags: string[]
    theme: 'light' | 'dark' | 'system' | string
    sortBy: string
}

interface SettingsActions {
    setColumns(columns: number): void
    setSelectedTags(tags: string[]): void
    setTheme(theme: string): void
    setSortBy(sortBy: string): void
    loadFromStorage(): void
    saveToStorage(): void
}
```

#### photosStore

```typescript
interface PhotosState {
    photos: Photo[]
    loading: boolean
    pagination: Pagination
    currentFilters: PhotoFilters
}

interface PhotosActions {
    fetchPhotos(filters?: PhotoFilters): Promise<void>
    loadMore(): Promise<void>
    uploadPhotos(files: File[], tags?: string[]): Promise<void>
    updatePhotoTags(photoId: number, tags: string[]): Promise<void>
    deletePhoto(photoId: number): Promise<void>
    batchUpdateTags(photoIds: number[], tags: string[]): Promise<void>
    batchDelete(photoIds: number[]): Promise<void>
}
```


---

## 5. 功能模块详细设计

### 5.1 主题系统

#### CSS 变量定义

```css
:root {
    /* 明亮主题 (默认) */
    --color-bg-primary: #ffffff;
    --color-bg-secondary: #f5f5f5;
    --color-text-primary: #333333;
    --color-text-secondary: #666666;
    --color-accent: #4a90d9;
    --color-border: #e0e0e0;
    --color-overlay: rgba(0, 0, 0, 0. 5);
}

[data-theme="dark"] {
    --color-bg-primary: #1a1a1a;
    --color-bg-secondary: #2d2d2d;
    --color-text-primary: #ffffff;
    --color-text-secondary: #aaaaaa;
    --color-accent: #5ba0e9;
    --color-border: #404040;
    --color-overlay: rgba(0, 0, 0, 0. 7);
}

[data-theme="custom"] {
    --color-accent: var(--custom-accent-color);
}
```

#### useTheme Composable

```typescript
export function useTheme() {
    const settingsStore = useSettingsStore()
    
    const applyTheme = (theme: string) => {
        if (theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light'
        } else if (theme === 'light' || theme === 'dark') {
            document.documentElement.dataset.theme = theme
        } else {
            // 自定义颜色
            document.documentElement.dataset.theme = 'custom'
            document.documentElement.style.setProperty('--custom-accent-color', theme)
        }
    }
    
    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
        if (settingsStore.theme === 'system') {
            applyTheme('system')
        }
    })
    
    return { applyTheme }
}
```

### 5.2 瀑布流布局

#### 实现方案

使用 CSS Grid + JavaScript 动态计算实现真正的瀑布流效果：

```typescript
// composables/useWaterfall.ts
export function useWaterfall(containerRef: Ref<HTMLElement>, columns: Ref<number>) {
    const columnHeights = ref<number[]>([])
    
    const calculateLayout = () => {
        const container = containerRef.value
        if (!container) return
        
        const items = container.querySelectorAll('.waterfall-item')
        const gap = 16
        const columnWidth = (container.clientWidth - gap * (columns.value - 1)) / columns.value
        
        // 重置列高度
        columnHeights.value = new Array(columns.value).fill(0)
        
        items.forEach((item) => {
            // 找到最短的列
            const minHeight = Math.min(...columnHeights. value)
            const columnIndex = columnHeights.value. indexOf(minHeight)
            
            // 定位元素
            const left = columnIndex * (columnWidth + gap)
            const top = minHeight
            
            (item as HTMLElement).style.transform = `translate(${left}px, ${top}px)`
            (item as HTMLElement). style.width = `${columnWidth}px`
            
            // 更新列高度
            columnHeights. value[columnIndex] += (item as HTMLElement).offsetHeight + gap
        })
        
        // 设置容器高度
        container.style.height = `${Math.max(...columnHeights.value)}px`
    }
    
    return { calculateLayout, columnHeights }
}
```

### 5.3 图片上传

#### 上传流程

```
1. 用户选择/拖拽图片
         ↓
2.  前端验证（格式、大小）
         ↓
3. 生成预览缩略图
         ↓
4. 显示上传进度
         ↓
5. 调用 POST /api/photos 上传
         ↓
6. 后端处理：
   - 生成 UUID 文件名
   - 保存原图
   - 生成缩略图 (可选，使用 sharp)
   - 提取图片尺寸
   - 存储数据库记录
         ↓
7. 返回上传结果
         ↓
8. 刷新图片列表
```

#### 文件验证规则

```typescript
const UPLOAD_CONFIG = {
    maxFileSize: 10 * 1024 * 1024,  // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxFiles: 20  // 单次最多上传文件数
}
```

### 5.4 标签系统

#### 标签解析

```typescript
// 从输入文本解析标签
function parseTags(input: string): string[] {
    const regex = /#([^\s#]+)/g
    const matches = input. matchAll(regex)
    const tags = new Set<string>()
    
    for (const match of matches) {
        const tag = match[1]. trim()
        if (tag) {
            tags.add(tag)
        }
    }
    
    return Array. from(tags)
}

// 示例
parseTags('#风景 #夏天 #海边 ')
// 返回: ['风景', '夏天', '海边']
```

#### 标签自动补全

```typescript
// TagInput 组件中实现
const searchTags = async (keyword: string) => {
    if (!keyword) return []
    
    const response = await api.tags.search({ keyword })
    return response.data
}
```

### 5.5 右键菜单系统

#### useContextMenu Composable

```typescript
interface ContextMenuState {
    visible: boolean
    x: number
    y: number
    items: ContextMenuItem[]
    targetData: any
}

interface ContextMenuItem {
    id: string
    label: string
    icon?: string
    disabled?: boolean
    divider?: boolean
    action?: () => void
}

export function useContextMenu() {
    const state = reactive<ContextMenuState>({
        visible: false,
        x: 0,
        y: 0,
        items: [],
        targetData: null
    })
    
    const show = (event: MouseEvent, items: ContextMenuItem[], data?: any) => {
        event.preventDefault()
        state.x = event.clientX
        state. y = event.clientY
        state. items = items
        state.targetData = data
        state.visible = true
    }
    
    const hide = () => {
        state.visible = false
    }
    
    // 点击外部关闭
    onMounted(() => {
        document.addEventListener('click', hide)
    })
    
    onUnmounted(() => {
        document. removeEventListener('click', hide)
    })
    
    return { state, show, hide }
}
```

#### 菜单项逻辑

```typescript
// 主内容区图片右键菜单
function getPhotoContextMenuItems(photo: Photo, authStore: AuthStore): ContextMenuItem[] {
    const items: ContextMenuItem[] = [
        { id: 'zoom', label: '放大', icon: 'zoom-in' },
        { id: 'download', label: '下载', icon: 'download' }
    ]
    
    // 自己上传的图片或管理员
    if (photo. userId === authStore.currentUserId || authStore.isAdmin) {
        items.push({ divider: true })
        items.push({ id: 'edit-tags', label: '编辑标签', icon: 'tag' })
        items.push({ id: 'delete', label: '删除', icon: 'trash' })
    }
    
    // 管理员额外功能
    if (authStore. isAdmin) {
        items.push({ divider: true })
        items.push({ id: 'multi-select', label: '多选', icon: 'check-square' })
    }
    
    return items
}
```


---

## 6.  PWA 配置

### 6.1 Vite PWA 插件配置

```typescript
// vite.config.js
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        vue(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
            manifest: {
                name: 'PhotoWall - 照片墙',
                short_name: 'PhotoWall',
                description: '多用户照片墙系统',
                theme_color: '#4a90d9',
                background_color: '#ffffff',
                display: 'standalone',
                start_url: '/',
                icons: [
                    {
                        src: '/icons/icon-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '/icons/icon-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/.*\/api\/photos/,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-photos',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24  // 1 day
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/.*\/uploads\//,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'photo-cache',
                            expiration: {
                                maxEntries: 200,
                                maxAgeSeconds: 60 * 60 * 24 * 30  // 30 days
                            }
                        }
                    }
                ]
            }
        })
    ]
})
```

### 6.2 离线功能

* 已浏览过的图片可离线查看
* 基础界面离线可用
* 在线时自动同步


---

## 7.  安全设计

### 7.1 认证与授权

```typescript
// middleware/auth.js
const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
    const token = req.headers. authorization?.replace('Bearer ', '')
    
    if (! token) {
        return res.status(401).json({ error: 'No token provided' })
    }
    
    try {
        const decoded = jwt.verify(token, process.env. JWT_SECRET)
        req.user = decoded
        next()
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' })
    }
}

const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403). json({ error: 'Admin access required' })
    }
    next()
}
```

### 7.2 密码安全

```typescript
// 使用 bcrypt 加密密码
const bcrypt = require('bcrypt')
const SALT_ROUNDS = 10

const hashPassword = async (password) => {
    return await bcrypt.hash(password, SALT_ROUNDS)
}

const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash)
}
```

### 7.3 文件上传安全

```typescript
// middleware/upload.js
const multer = require('multer')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

const storage = multer.diskStorage({
    destination: './uploads/photos',
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, `${uuidv4()}${ext}`)
    }
})

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (allowedTypes. includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error('Invalid file type'), false)
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024  // 10MB
    }
})
```


---

## 8.  部署方案

### 8.1 一体化启动脚本

```javascript
// server/index.js
const express = require('express')
const path = require('path')
const history = require('connect-history-api-fallback')

const app = express()

// API 路由
app.use('/api/auth', require('./routes/auth'))
app.use('/api/users', require('./routes/users'))
app. use('/api/photos', require('./routes/photos'))
app.use('/api/tags', require('./routes/tags'))

// 静态文件 - 上传的图片
app. use('/uploads', express.static(path. join(__dirname, '../uploads')))

// Vue SPA 支持
app.use(history())

// 静态文件 - Vue 构建产物
app.use(express.static(path.join(__dirname, '../dist')))

const PORT = process.env. PORT || 3000
app.listen(PORT, () => {
    console.log(`PhotoWall server running on http://localhost:${PORT}`)
})
```

### 8.2 package.json 脚本

```json
{
    "scripts": {
        "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
        "dev:server": "nodemon server/index. js",
        "dev:client": "vite",
        "build": "vite build",
        "start": "node server/index.js",
        "init-db": "node server/scripts/initDatabase.js"
    }
}
```

### 8. 3 环境变量

```env
# . env
PORT=3000
JWT_SECRET=your-super-secret-key
DB_PATH=./data/photowall.db
UPLOAD_PATH=./uploads/photos
```

### 8.4 初始化脚本

```javascript
// server/scripts/initDatabase.js
// 创建数据库表
// 创建默认管理员账号
const defaultAdmin = {
    username: 'admin',
    password: 'admin123',  // 首次启动后提示修改
    displayName: '管理员',
    role: 'admin'
}
```


---

## 9. 开发计划

### 阶段一：基础架构 (Week 1)

- [x] 项目初始化
- [x] 数据库设计与实现
- [x] Express 服务器搭建
- [x] JWT 认证系统
- [x] 基础 API 框架

### 阶段二：核心功能 (Week 2-3)

- [x] 用户管理 API
- [x] 图片上传/管理 API
- [x] 标签系统 API
- [x] Vue 基础组件
- [x] 状态管理

### 阶段三：界面实现 (Week 3-4)

- [x] 侧边栏组件
- [x] 瀑布流布局
- [x] 图片查看器
- [ ] 各功能弹窗
- [x] 右键菜单

### 阶段四：优化完善 (Week 5)

- [x] 主题系统
- [ ] PWA 配置
- [ ] 响应式适配
- [ ] 性能优化
- [ ] 测试与修复

### 阶段五：部署上线 (Week 6)

- [ ] 生产环境配置
- [ ] 部署文档
- [ ] 用户手册


---

## 10. 附录

### 10. 1 类型定义汇总

```typescript
// types/index.ts

interface User {
    id: number
    username: string
    displayName: string
    role: 'admin' | 'user'
    createdAt: string
    updatedAt: string
}

interface Photo {
    id: number
    filename: string
    originalName: string
    url: string
    thumbnailUrl?: string
    width: number
    height: number
    fileSize: number
    userId: number
    uploaderName: string
    tags: string[]
    createdAt: string
    updatedAt: string
}

interface Tag {
    id: number
    name: string
    count?: number
}

interface Pagination {
    page: number
    limit: number
    total: number
    totalPages: number
}

interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: string
    message?: string
}
```

### 10.2 推荐依赖

```json
{
    "dependencies": {
        "express": "^4.18.2",
        "better-sqlite3": "^9.2.2",
        "bcrypt": "^5. 1.1",
        "jsonwebtoken": "^9.0.2",
        "multer": "^1.4.5-lts.1",
        "sharp": "^0. 33.0",
        "uuid": "^9.0.0",
        "cors": "^2. 8.5",
        "connect-history-api-fallback": "^2. 0.0",
        "dotenv": "^16.3.1"
    },
    "devDependencies": {
        "vue": "^3. 3.8",
        "vite": "^5.0.0",
        "@vitejs/plugin-vue": "^4.5.0",
        "vite-plugin-pwa": "^0. 17.0",
        "pinia": "^2.1.7",
        "axios": "^1. 6.2",
        "concurrently": "^8.2.2",
        "nodemon": "^3.0.1"
    }
}
```


---

以上计划书涵盖了项目的完整设计，可作为后续开发的指导文档。如需进一步细化某个模块或开始实际开发，请随时告知。