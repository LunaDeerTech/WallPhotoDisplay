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

export interface UserUpdatePayload {
  displayName?: string
  password?: string
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
  // URL fields computed by backend
  url?: string
  thumbnailUrl?: string
  // Dimension fields (may be computed)
  width?: number
  height?: number
  status: 'pending' | 'approved' | 'rejected'
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
  count?: number  // Alias for photoCount, used in some components
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
export type ThemeMode = 'light' | 'dark' | 'system' | 'custom'
export type SortBy = 'created_at_desc' | 'created_at_asc' | 'random'

export interface BrowseSettings {
  columns: number
  theme: ThemeMode
  customColor?: string
  customAccentColor?: string
  sortBy: SortBy
  selectedTags: string[]
}

// 右键菜单相关类型
export interface ContextMenuItem {
  id: string
  label: string
  icon?: string
  shortcut?: string
  disabled?: boolean
  danger?: boolean
  divider?: boolean
  action?: () => void
}

export interface ContextMenuPosition {
  x: number
  y: number
}

// 瀑布流相关类型
export interface WaterfallItem {
  id: number
  height: number
  width: number
  top: number
  left: number
  columnIndex: number
}

// 多选相关类型
export interface MultiSelectState {
  enabled: boolean
  selectedIds: Set<number>
}

// 系统配置类型
export interface SystemConfig {
  siteName: string
  siteDescription: string
  menuTitle: string
  menuIconUrl: string
  forceLogin?: boolean
  uploadReview?: boolean
}
