# Wall Photo Display - JavaScript to TypeScript Migration Guide

本文档提供将 Wall Photo Display 项目从 JavaScript 迁移到 TypeScript 的详细步骤指南。

## 目录

1. [迁移概述](#迁移概述)
2. [阶段一：环境准备](#阶段一环境准备)
3. [阶段二：前端迁移](#阶段二前端迁移)
4. [阶段三：后端迁移](#阶段三后端迁移)
5. [阶段四：类型定义完善](#阶段四类型定义完善)
6. [阶段五：测试与验证](#阶段五测试与验证)
7. [常见问题与解决方案](#常见问题与解决方案)

---

## 迁移概述

### 项目当前结构

```
wall-photo-display/
├── server/          # Express.js 后端 (ES Modules)
│   ├── routes/      # API 路由
│   ├── controllers/ # 业务逻辑
│   ├── models/      # SQLite 数据模型
│   └── middleware/  # JWT 认证、文件上传
├── src/             # Vue 3 前端
│   ├── api/         # Axios API 客户端
│   ├── stores/      # Pinia stores
│   ├── components/  # Vue 组件
│   └── composables/ # 组合式函数
└── uploads/photos/  # 用户上传的图片
```

### 迁移策略

采用**渐进式迁移**策略：
1. 先配置 TypeScript 支持，允许 JS/TS 混合
2. 优先迁移核心模块（类型定义、utils、stores）
3. 逐步迁移其他模块
4. 最后移除所有 JS 文件

### 预估工作量

| 模块 | 文件数量 | 复杂度 | 预估时间 |
|------|---------|--------|---------|
| 前端 utils | 2 | 低 | 1h |
| 前端 api | 4 | 中 | 2h |
| 前端 stores | 3 | 中 | 2h |
| 前端 composables | 5 | 中 | 2h |
| 前端 components | 18 | 高 | 6h |
| 后端 models | 4 | 中 | 2h |
| 后端 controllers | 4 | 中 | 3h |
| 后端 routes | 4 | 低 | 1h |
| 后端 middleware | 2 | 中 | 1h |
| **总计** | **46** | - | **~20h** |

---

## 阶段一：环境准备

### 1.1 安装 TypeScript 及相关依赖

```bash
# TypeScript 核心
npm install -D typescript

# Vue 3 TypeScript 支持
npm install -D vue-tsc @vue/tsconfig

# Node.js 类型定义
npm install -D @types/node

# 后端依赖类型定义
npm install -D @types/express @types/cors @types/bcrypt @types/jsonwebtoken @types/multer @types/uuid

# better-sqlite3 类型
npm install -D @types/better-sqlite3

# 前端依赖（axios 和 pinia 已内置类型）
```

### 1.2 创建前端 tsconfig.json

在项目根目录创建 `tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 1.3 创建 Node 环境 tsconfig.node.json

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

### 1.4 创建后端 tsconfig.server.json

在项目根目录创建 `tsconfig.server.json`：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist/server",
    "rootDir": "./server",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["server/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### 1.5 添加 Vue 类型声明文件

创建 `src/env.d.ts`：

```typescript
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

### 1.6 更新 vite.config.js → vite.config.ts

重命名文件并更新内容（添加类型注解）。这是第一个要迁移的文件。

### 1.7 更新 package.json 脚本

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "tsx watch server/index.ts",
    "dev:client": "vite",
    "build": "vue-tsc && vite build",
    "build:server": "tsc -p tsconfig.server.json",
    "start": "node dist/server/index.js",
    "init-db": "tsx server/scripts/initDatabase.ts",
    "typecheck": "vue-tsc --noEmit && tsc -p tsconfig.server.json --noEmit",
    "preview": "vite preview"
  }
}
```

安装 tsx 用于开发时运行 TypeScript：

```bash
npm install -D tsx
```

---

## 阶段二：前端迁移

### 2.1 迁移顺序

按照依赖关系从底层到上层迁移：

```
1. src/types/           # 新建：类型定义
2. src/utils/           # 工具函数
3. src/api/             # API 客户端
4. src/stores/          # Pinia stores
5. src/composables/     # 组合式函数
6. src/components/      # Vue 组件
7. src/App.vue          # 根组件
8. src/main.ts          # 入口文件
```

### 2.2 创建类型定义目录

创建 `src/types/` 目录，定义核心类型：

#### `src/types/index.ts`

```typescript
// 用户相关类型
export interface User {
  id: number
  username: string
  displayName: string
  role: 'admin' | 'user'
  createdAt: string
  updatedAt: string
}

export interface UserCreatePayload {
  username: string
  password: string
  displayName?: string
  role?: 'admin' | 'user'
}

// 照片相关类型
export interface Photo {
  id: number
  filename: string
  originalName: string
  thumbnailPath: string
  userId: number
  uploaderName: string
  tags: Tag[]
  createdAt: string
  updatedAt: string
}

export interface PhotoUploadPayload {
  file: File
  tags?: string[]
}

// 标签相关类型
export interface Tag {
  id: number
  name: string
  photoCount?: number
  createdAt: string
}

// API 响应类型
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// 认证相关类型
export interface LoginPayload {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

// 设置相关类型
export interface BrowseSettings {
  columns: number
  theme: 'light' | 'dark' | 'system' | 'custom'
  customColor?: string
  sortBy: 'newest' | 'oldest' | 'name'
  selectedTags: string[]
}
```

### 2.3 迁移 utils

#### `src/utils/request.ts`

```typescript
import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'

const TOKEN_KEY = 'photowall_token'

// 创建 axios 实例
const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function hasToken(): boolean {
  return !!getToken()
}

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: Error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error) => {
    // 错误处理...
    return Promise.reject(error.response?.data || error)
  }
)

export default request
```

#### `src/utils/helpers.ts`

```typescript
/**
 * 解析标签字符串
 * @param input - 包含 #标签 格式的字符串
 * @returns 标签名称数组
 */
export function parseTags(input: string): string[] {
  const regex = /#(\S+)/g
  const tags: string[] = []
  let match: RegExpExecArray | null
  
  while ((match = regex.exec(input)) !== null) {
    tags.push(match[1])
  }
  
  return [...new Set(tags)] // 去重
}

/**
 * 格式化日期
 * @param dateString - ISO 日期字符串
 * @returns 格式化后的日期字符串
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      fn.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
```

### 2.4 迁移 API 模块

#### `src/api/auth.ts`

```typescript
import request from '@/utils/request'
import type { ApiResponse, LoginPayload, LoginResponse, User } from '@/types'

const authApi = {
  login(username: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return request.post('/auth/login', { username, password })
  },

  logout(): Promise<ApiResponse<void>> {
    return request.post('/auth/logout')
  },

  getCurrentUser(): Promise<ApiResponse<User>> {
    return request.get('/auth/me')
  }
}

export default authApi
```

#### `src/api/photos.ts`

```typescript
import request from '@/utils/request'
import type { ApiResponse, PaginatedResponse, Photo } from '@/types'

export interface PhotoQueryParams {
  page?: number
  limit?: number
  tags?: string[]
  sort?: 'newest' | 'oldest' | 'name'
  userId?: number
}

const photosApi = {
  getPhotos(params: PhotoQueryParams = {}): Promise<PaginatedResponse<Photo>> {
    return request.get('/photos', { params })
  },

  getPhotoById(id: number): Promise<ApiResponse<Photo>> {
    return request.get(`/photos/${id}`)
  },

  uploadPhoto(formData: FormData): Promise<ApiResponse<Photo>> {
    return request.post('/photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  updatePhotoTags(id: number, tags: string[]): Promise<ApiResponse<Photo>> {
    return request.put(`/photos/${id}/tags`, { tags })
  },

  deletePhoto(id: number): Promise<ApiResponse<void>> {
    return request.delete(`/photos/${id}`)
  },

  batchDelete(ids: number[]): Promise<ApiResponse<{ deleted: number }>> {
    return request.delete('/photos/batch', { data: { ids } })
  },

  batchUpdateTags(ids: number[], tags: string[]): Promise<ApiResponse<{ updated: number }>> {
    return request.put('/photos/batch/tags', { ids, tags })
  }
}

export default photosApi
```

### 2.5 迁移 Pinia Stores

#### `src/stores/auth.ts`

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import authApi from '@/api/auth'
import { setToken, removeToken, getToken, hasToken } from '@/utils/request'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string | null>(getToken())
  const user = ref<User | null>(null)
  const loading = ref(false)

  // Getters
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const currentUserId = computed(() => user.value?.id ?? null)
  const displayName = computed(() => user.value?.displayName ?? user.value?.username ?? '')

  // Actions
  async function login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    loading.value = true
    try {
      const response = await authApi.login(username, password)
      
      if (response.success && response.data) {
        token.value = response.data.token
        user.value = response.data.user
        setToken(response.data.token)
        return { success: true }
      }
      return { success: false, error: response.error ?? 'Login failed' }
    } catch (error: any) {
      console.error('Login error:', error)
      return { success: false, error: error.error ?? 'Login failed' }
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    try {
      if (token.value) {
        await authApi.logout().catch(() => {})
      }
    } finally {
      token.value = null
      user.value = null
      removeToken()
    }
  }

  async function fetchCurrentUser(): Promise<boolean> {
    if (!hasToken()) return false

    loading.value = true
    try {
      const response = await authApi.getCurrentUser()
      if (response.success && response.data) {
        user.value = response.data
        return true
      }
      return false
    } catch {
      token.value = null
      user.value = null
      removeToken()
      return false
    } finally {
      loading.value = false
    }
  }

  async function init(): Promise<void> {
    if (hasToken()) {
      await fetchCurrentUser()
    }
  }

  return {
    token,
    user,
    loading,
    isLoggedIn,
    isAdmin,
    currentUserId,
    displayName,
    login,
    logout,
    fetchCurrentUser,
    init
  }
})
```

### 2.6 迁移 Composables

#### `src/composables/useTheme.ts`

```typescript
import { ref, watch, onMounted } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system' | 'custom'

const THEME_KEY = 'photowall_theme'
const COLOR_KEY = 'photowall_custom_color'

export function useTheme() {
  const theme = ref<ThemeMode>('system')
  const customColor = ref('#4a90d9')
  const actualTheme = ref<'light' | 'dark'>('light')

  function applyTheme(): void {
    let effectiveTheme: 'light' | 'dark'
    
    if (theme.value === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } else if (theme.value === 'custom') {
      effectiveTheme = 'light' // 自定义颜色基于浅色主题
      document.documentElement.style.setProperty('--color-primary', customColor.value)
    } else {
      effectiveTheme = theme.value
    }
    
    actualTheme.value = effectiveTheme
    document.documentElement.setAttribute('data-theme', effectiveTheme)
  }

  function setTheme(newTheme: ThemeMode, color?: string): void {
    theme.value = newTheme
    if (color) customColor.value = color
    
    localStorage.setItem(THEME_KEY, newTheme)
    if (color) localStorage.setItem(COLOR_KEY, color)
    
    applyTheme()
  }

  function initTheme(): void {
    const savedTheme = localStorage.getItem(THEME_KEY) as ThemeMode | null
    const savedColor = localStorage.getItem(COLOR_KEY)
    
    if (savedTheme) theme.value = savedTheme
    if (savedColor) customColor.value = savedColor
    
    applyTheme()
    
    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (theme.value === 'system') applyTheme()
    })
  }

  onMounted(initTheme)

  return {
    theme,
    customColor,
    actualTheme,
    setTheme
  }
}
```

### 2.7 迁移 Vue 组件

Vue 组件使用 `<script setup lang="ts">` 语法：

#### 组件示例：`src/components/common/Modal.vue`

```vue
<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

interface Props {
  visible: boolean
  title?: string
  width?: string
  closable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  width: '500px',
  closable: true
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
}>()

function close(): void {
  if (props.closable) {
    emit('update:visible', false)
    emit('close')
  }
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && props.closable) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="close">
        <div class="modal-container" :style="{ width }">
          <div class="modal-header" v-if="title || closable">
            <h3 v-if="title">{{ title }}</h3>
            <button v-if="closable" class="close-btn" @click="close">×</button>
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div class="modal-footer" v-if="$slots.footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
```

### 2.8 更新入口文件

#### `src/main.ts`

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { useAuthStore } from './stores/auth'

import './styles/variables.css'
import './styles/themes.css'
import './styles/global.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Initialize auth store before mounting
const authStore = useAuthStore()
authStore.init().then(() => {
  app.mount('#app')
})
```

---

## 阶段三：后端迁移

### 3.1 迁移顺序

```
1. server/types/        # 新建：类型定义
2. server/config/       # 配置文件
3. server/models/       # 数据模型
4. server/middleware/   # 中间件
5. server/controllers/  # 控制器
6. server/routes/       # 路由
7. server/index.ts      # 入口文件
```

### 3.2 创建后端类型定义

#### `server/types/index.ts`

```typescript
import { Request } from 'express'

// 数据库实体类型
export interface UserEntity {
  id: number
  username: string
  password: string
  display_name: string
  role: 'admin' | 'user'
  created_at: string
  updated_at: string
}

export interface PhotoEntity {
  id: number
  filename: string
  original_name: string
  thumbnail_path: string
  user_id: number
  created_at: string
  updated_at: string
}

export interface TagEntity {
  id: number
  name: string
  created_at: string
}

// API 请求类型
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number
    username: string
    role: 'admin' | 'user'
  }
}

// API 响应类型
export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: string
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

// JWT Payload
export interface JwtPayload {
  id: number
  username: string
  role: 'admin' | 'user'
  iat?: number
  exp?: number
}
```

### 3.3 迁移数据库配置

#### `server/config/database.ts`

```typescript
import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/photowall.db')

const db = new Database(dbPath)

// 启用外键约束
db.pragma('foreign_keys = ON')

export default db
```

### 3.4 迁移 Models

#### `server/models/User.ts`

```typescript
import db from '../config/database.js'
import bcrypt from 'bcrypt'
import type { UserEntity } from '../types/index.js'

const SALT_ROUNDS = 10

export interface UserCreateInput {
  username: string
  password: string
  displayName?: string
  role?: 'admin' | 'user'
}

export interface UserUpdateInput {
  displayName?: string
  role?: 'admin' | 'user'
}

export interface UserPublic {
  id: number
  username: string
  displayName: string
  role: 'admin' | 'user'
  createdAt: string
  updatedAt: string
}

const User = {
  create({ username, password, displayName, role = 'user' }: UserCreateInput): UserPublic | null {
    const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS)
    
    const stmt = db.prepare(`
      INSERT INTO users (username, password, display_name, role)
      VALUES (?, ?, ?, ?)
    `)
    
    const result = stmt.run(username, hashedPassword, displayName || username, role)
    
    return this.findById(result.lastInsertRowid as number)
  },

  findById(id: number): UserPublic | null {
    const stmt = db.prepare(`
      SELECT id, username, display_name as displayName, role, 
             created_at as createdAt, updated_at as updatedAt
      FROM users WHERE id = ?
    `)
    return stmt.get(id) as UserPublic | undefined ?? null
  },

  findByUsername(username: string): (UserPublic & { password: string }) | null {
    const stmt = db.prepare(`
      SELECT id, username, password, display_name as displayName, role,
             created_at as createdAt, updated_at as updatedAt
      FROM users WHERE username = ?
    `)
    return stmt.get(username) as (UserPublic & { password: string }) | undefined ?? null
  },

  findAll(): UserPublic[] {
    const stmt = db.prepare(`
      SELECT id, username, display_name as displayName, role,
             created_at as createdAt, updated_at as updatedAt
      FROM users ORDER BY created_at DESC
    `)
    return stmt.all() as UserPublic[]
  },

  update(id: number, { displayName, role }: UserUpdateInput): UserPublic | null {
    const updates: string[] = []
    const values: (string | number)[] = []

    if (displayName !== undefined) {
      updates.push('display_name = ?')
      values.push(displayName)
    }
    if (role !== undefined) {
      updates.push('role = ?')
      values.push(role)
    }

    if (updates.length === 0) return this.findById(id)

    updates.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
    stmt.run(...values)

    return this.findById(id)
  },

  updatePassword(id: number, newPassword: string): boolean {
    const hashedPassword = bcrypt.hashSync(newPassword, SALT_ROUNDS)
    const stmt = db.prepare(`
      UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `)
    const result = stmt.run(hashedPassword, id)
    return result.changes > 0
  },

  delete(id: number): boolean {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  },

  verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword)
  }
}

export default User
```

### 3.5 迁移 Middleware

#### `server/middleware/auth.ts`

```typescript
import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { AuthenticatedRequest, JwtPayload } from '../types/index.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization
  
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'No token provided' })
    return
  }
  
  const token = authHeader.slice(7)
  const payload = verifyToken(token)
  
  if (!payload) {
    res.status(401).json({ success: false, error: 'Invalid or expired token' })
    return
  }
  
  req.user = {
    id: payload.id,
    username: payload.username,
    role: payload.role
  }
  
  next()
}

export function adminMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin access required' })
    return
  }
  next()
}
```

### 3.6 迁移 Controllers

#### `server/controllers/authController.ts`

```typescript
import { Response } from 'express'
import User from '../models/User.js'
import { generateToken } from '../middleware/auth.js'
import type { AuthenticatedRequest } from '../types/index.js'

export async function login(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { username, password } = req.body as { username?: string; password?: string }
    
    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: 'Username and password are required'
      })
      return
    }
    
    const user = User.findByUsername(username)
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      })
      return
    }
    
    const isPasswordValid = await User.verifyPassword(password, user.password)
    
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      })
      return
    }
    
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role
    })
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          role: user.role
        }
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      error: 'Login failed'
    })
  }
}

export async function logout(_req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json({
    success: true,
    message: 'Logged out successfully'
  })
}

export async function getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }
    
    const user = User.findById(req.user.id)
    
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' })
      return
    }
    
    res.json({ success: true, data: user })
  } catch (error) {
    console.error('Get current user error:', error)
    res.status(500).json({ success: false, error: 'Failed to get user info' })
  }
}
```

### 3.7 迁移 Routes

#### `server/routes/auth.ts`

```typescript
import { Router } from 'express'
import { login, logout, getCurrentUser } from '../controllers/authController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/login', login)
router.post('/logout', logout)
router.get('/me', authMiddleware, getCurrentUser)

export default router
```

### 3.8 迁移入口文件

#### `server/index.ts`

```typescript
import express, { ErrorRequestHandler } from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
import history from 'connect-history-api-fallback'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import photoRoutes from './routes/photos.js'
import tagRoutes from './routes/tags.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/photos', photoRoutes)
app.use('/api/tags', tagRoutes)

// Static files - uploaded photos
const uploadPath = process.env.UPLOAD_PATH || path.join(__dirname, '../uploads')
app.use('/uploads', express.static(uploadPath))

// Vue SPA support
app.use(history())
app.use(express.static(path.join(__dirname, '../dist')))

// Error handling
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  })
}
app.use(errorHandler)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`PhotoWall server running on http://localhost:${PORT}`)
})
```

---

## 阶段四：类型定义完善

### 4.1 为第三方库创建声明文件

如果某些库缺少类型定义，在 `src/types/` 或 `server/types/` 下创建 `.d.ts` 文件：

#### `server/types/connect-history-api-fallback.d.ts`

```typescript
declare module 'connect-history-api-fallback' {
  import { RequestHandler } from 'express'
  
  interface Options {
    index?: string
    rewrites?: Array<{
      from: RegExp
      to: string | ((context: { match: RegExpMatchArray; parsedUrl: URL }) => string)
    }>
    verbose?: boolean
    htmlAcceptHeaders?: string[]
    disableDotRule?: boolean
  }
  
  function history(options?: Options): RequestHandler
  export = history
}
```

### 4.2 配置路径别名

确保 `vite.config.ts` 中配置了路径别名：

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  // ...
})
```

### 4.3 严格模式逐步开启

初始迁移时可以放宽类型检查，后续逐步收紧：

```json
{
  "compilerOptions": {
    // 初始阶段
    "strict": false,
    "noImplicitAny": false,
    
    // 逐步开启
    // "strict": true,
    // "strictNullChecks": true,
    // "strictFunctionTypes": true,
    // "strictBindCallApply": true,
    // "strictPropertyInitialization": true,
    // "noImplicitThis": true,
    // "alwaysStrict": true
  }
}
```

---

## 阶段五：测试与验证

### 5.1 类型检查

```bash
# 前端类型检查
npx vue-tsc --noEmit

# 后端类型检查
npx tsc -p tsconfig.server.json --noEmit

# 完整类型检查
npm run typecheck
```

### 5.2 构建测试

```bash
# 前端构建
npm run build

# 后端构建
npm run build:server
```

### 5.3 运行时测试

```bash
# 开发模式
npm run dev

# 生产模式
npm run build && npm run build:server && npm start
```

### 5.4 功能测试清单

- [ ] 用户登录/登出
- [ ] 图片上传
- [ ] 图片浏览与筛选
- [ ] 标签管理
- [ ] 用户管理（管理员）
- [ ] 主题切换
- [ ] PWA 功能

---

## 常见问题与解决方案

### Q1: Vue 组件导入报错

**问题**: `Cannot find module './Component.vue'`

**解决**: 确保 `src/env.d.ts` 包含 Vue 模块声明：

```typescript
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
```

### Q2: better-sqlite3 类型问题

**问题**: `stmt.get()` 返回类型不正确

**解决**: 使用类型断言：

```typescript
const user = stmt.get(id) as UserPublic | undefined
```

### Q3: Express 中间件类型

**问题**: 中间件函数类型不匹配

**解决**: 使用正确的函数签名：

```typescript
import { Request, Response, NextFunction } from 'express'

function middleware(req: Request, res: Response, next: NextFunction): void {
  // ...
  next()
}
```

### Q4: Pinia Store 类型推断

**问题**: Store 返回类型复杂

**解决**: 使用 Setup Store 语法，让 TypeScript 自动推断类型。

### Q5: 循环依赖

**问题**: 类型导入导致循环依赖

**解决**: 使用 `import type` 语法：

```typescript
import type { User } from './types'
```

---

## 迁移检查清单

### 环境准备
- [ ] 安装 TypeScript 及相关依赖
- [ ] 创建 tsconfig.json（前端）
- [ ] 创建 tsconfig.server.json（后端）
- [ ] 创建类型声明文件
- [ ] 更新 package.json 脚本

### 前端迁移
- [ ] 创建 `src/types/index.ts`
- [ ] 迁移 `src/utils/`
- [ ] 迁移 `src/api/`
- [ ] 迁移 `src/stores/`
- [ ] 迁移 `src/composables/`
- [ ] 迁移 `src/components/common/`
- [ ] 迁移 `src/components/dialogs/`
- [ ] 迁移 `src/components/layout/`
- [ ] 迁移 `src/components/photo/`
- [ ] 迁移 `src/App.vue`
- [ ] 迁移 `src/main.ts`
- [ ] 迁移 `vite.config.ts`

### 后端迁移
- [ ] 创建 `server/types/index.ts`
- [ ] 迁移 `server/config/`
- [ ] 迁移 `server/models/`
- [ ] 迁移 `server/middleware/`
- [ ] 迁移 `server/controllers/`
- [ ] 迁移 `server/routes/`
- [ ] 迁移 `server/scripts/`
- [ ] 迁移 `server/index.ts`

### 验证
- [ ] 类型检查通过
- [ ] 构建成功
- [ ] 功能测试通过
- [ ] 删除所有 .js 文件

---

## 参考资源

- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [Vue 3 + TypeScript](https://vuejs.org/guide/typescript/overview.html)
- [Pinia + TypeScript](https://pinia.vuejs.org/core-concepts/typescript.html)
- [Express + TypeScript](https://expressjs.com/en/advanced/typescript.html)
