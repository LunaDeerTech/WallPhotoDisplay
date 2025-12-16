import type { Request } from 'express'

// =====================
// 数据库实体类型 (对应数据库表结构)
// =====================

/**
 * 用户实体 (users 表)
 */
export interface UserEntity {
  id: number
  username: string
  password: string
  display_name: string
  email?: string
  email_verified: number // SQLite stores boolean as 0/1
  role: 'admin' | 'user'
  created_at: string
  updated_at: string
}

/**
 * 照片实体 (photos 表)
 */
export interface PhotoEntity {
  id: number
  user_id: number
  filename: string
  original_name: string
  file_path: string
  file_size: number | null
  mime_type: string | null
  width: number | null
  height: number | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

/**
 * 标签实体 (tags 表)
 */
export interface TagEntity {
  id: number
  name: string
  created_at: string
}

/**
 * 图片标签关联实体 (photo_tags 表)
 */
export interface PhotoTagEntity {
  photo_id: number
  tag_id: number
}

// =====================
// API 响应模型类型 (驼峰命名，用于API响应)
// =====================

/**
 * 用户公开信息 (不含密码)
 */
export interface UserPublic {
  id: number
  username: string
  displayName: string
  email?: string
  emailVerified: boolean
  role: 'admin' | 'user'
  createdAt: string
  updatedAt: string
}

/**
 * 用户完整信息 (含密码，仅内部使用)
 */
export interface UserWithPassword extends UserPublic {
  password: string
}

/**
 * 照片信息
 */
export interface PhotoResponse {
  id: number
  userId: number
  filename: string
  originalName: string
  filePath: string
  fileSize: number | null
  mimeType: string | null
  width: number | null
  height: number | null
  createdAt: string
  updatedAt: string
  uploaderName: string
  tags: TagResponse[]
  url?: string
  thumbnailUrl?: string
}

/**
 * 标签信息
 */
export interface TagResponse {
  id: number
  name: string
  photoCount?: number
  createdAt: string
}

// =====================
// 用户相关输入类型
// =====================

/**
 * 创建用户输入
 */
export interface UserCreateInput {
  username: string
  password: string
  displayName?: string
  email?: string
  role?: 'admin' | 'user'
}

/**
 * 更新用户输入
 */
export interface UserUpdateInput {
  displayName?: string
  email?: string
  role?: 'admin' | 'user'
}

/**
 * 更新密码输入
 */
export interface PasswordUpdateInput {
  currentPassword?: string
  newPassword: string
}

// =====================
// 照片相关输入类型
// =====================

/**
 * 创建照片输入
 */
export interface PhotoCreateInput {
  userId: number
  filename: string
  originalName?: string
  filePath: string
  fileSize?: number
  mimeType?: string
  width?: number
  height?: number
  status?: 'pending' | 'approved' | 'rejected'
}

/**
 * 照片查询参数
 */
export interface PhotoQueryParams {
  page?: number
  limit?: number
  tags?: string[]
  sort?: 'created_at_desc' | 'created_at_asc' | 'random'
  userId?: number
  userIds?: number[]
  status?: 'pending' | 'approved' | 'rejected'
}

/**
 * 照片分页结果
 */
export interface PhotoPaginatedResult {
  photos: PhotoResponse[]
  pagination: PaginationInfo
}

// =====================
// 通用类型
// =====================

/**
 * 分页信息
 */
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

/**
 * API 成功响应
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  message?: string
}

/**
 * API 错误响应
 */
export interface ApiErrorResponse {
  success: false
  error: string
}

/**
 * API 响应 (联合类型)
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * 分页 API 响应
 */
export interface PaginatedApiResponse<T> {
  success: true
  data: {
    items: T[]
    pagination: PaginationInfo
  }
}

// =====================
// 认证相关类型
// =====================

/**
 * JWT Payload
 */
export interface JwtPayload {
  id: number
  username: string
  role: 'admin' | 'user'
  iat?: number
  exp?: number
}

/**
 * 登录请求体
 */
export interface LoginRequestBody {
  username: string
  password: string
}

/**
 * 登录响应数据
 */
export interface LoginResponseData {
  token: string
  user: UserPublic
}

/**
 * 认证后的请求对象
 */
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload
}

/**
 * 需要认证的请求对象 (user 必定存在)
 */
export interface RequiredAuthRequest extends Request {
  user: JwtPayload
}

// =====================
// 文件上传相关类型
// =====================

/**
 * Multer 文件对象
 */
export interface MulterFile {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  destination: string
  filename: string
  path: string
  size: number
}

/**
 * 带文件的请求对象 - 使用类型交叉而非继承
 */
export type FileUploadRequest = AuthenticatedRequest & {
  file?: MulterFile
  files?: MulterFile[]
}

/**
 * 图片处理结果
 */
export interface ImageProcessResult {
  width: number | null
  height: number | null
}

// =====================
// 批量操作类型
// =====================

/**
 * 批量删除请求体
 */
export interface BatchDeleteRequestBody {
  ids: number[]
}

/**
 * 批量删除响应
 */
export interface BatchDeleteResponse {
  deletedIds: number[]
  errors?: Array<{ id: number; error: string }>
}

/**
 * 批量更新标签请求体
 */
export interface BatchUpdateTagsRequestBody {
  ids: number[]
  tags: string[]
}

/**
 * 批量更新标签响应
 */
export interface BatchUpdateTagsResponse {
  updatedIds: number[]
  tags: string[]
  errors?: Array<{ id: number; error: string }>
}

// =====================
// 照片上传相关类型
// =====================

/**
 * 照片上传请求体 (multipart/form-data)
 */
export interface PhotoUploadRequestBody {
  tags?: string
}

/**
 * 上传响应数据
 */
export interface UploadResponseData {
  photos: PhotoResponse[]
  errors?: Array<{ filename: string; error: string }>
}

// =====================
// 控制器方法类型
// =====================

import type { Response, NextFunction } from 'express'

/**
 * Express 路由处理器类型
 */
export type RouteHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => void | Promise<void>

/**
 * Express 中间件类型
 */
export type Middleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => void | Promise<void>

/**
 * Express 错误处理器类型
 */
export type ErrorHandler = (
  err: Error,
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => void | Promise<void>
