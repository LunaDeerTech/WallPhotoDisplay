import multer from 'multer'
import type { FileFilterCallback } from 'multer'
import { MulterError } from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import type { Request, Response, NextFunction } from 'express'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 上传目录 - 默认使用 data/uploads，与静态文件服务路径一致
export const UPLOAD_PATH: string = process.env.UPLOAD_PATH || path.join(__dirname, '../../data/uploads')

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true })
}

// 允许的文件类型
export const ALLOWED_TYPES: string[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

// 最大文件大小 (10MB)
export const MAX_FILE_SIZE: number = 10 * 1024 * 1024

// 单次最多上传文件数
export const MAX_FILES: number = 20

/**
 * 配置文件存储
 */
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void): void => {
    cb(null, UPLOAD_PATH)
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void): void => {
    // 生成 UUID 文件名，保留原扩展名
    const ext = path.extname(file.originalname).toLowerCase()
    const filename = `${uuidv4()}${ext}`
    cb(null, filename)
  }
})

/**
 * 文件过滤器 - 验证文件类型
 */
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${ALLOWED_TYPES.join(', ')}`))
  }
}

/**
 * 创建 multer 上传实例
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES
  }
})

/**
 * 单文件上传中间件
 */
export const uploadSingle = upload.single('photo')

/**
 * 多文件上传中间件
 */
export const uploadMultiple = upload.array('photos', MAX_FILES)

/**
 * 上传错误处理中间件
 */
export function handleUploadError(err: Error, _req: Request, res: Response, next: NextFunction): void {
  if (err instanceof MulterError) {
    // Multer 错误
    let message = 'File upload error'
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
        break
      case 'LIMIT_FILE_COUNT':
        message = `Too many files. Maximum is ${MAX_FILES} files`
        break
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected field name for file upload'
        break
    }
    
    res.status(400).json({
      success: false,
      error: message
    })
    return
  } else if (err) {
    // 其他错误（如文件类型验证错误）
    res.status(400).json({
      success: false,
      error: err.message
    })
    return
  }
  
  next()
}

/**
 * 删除上传的文件
 */
export function deleteUploadedFile(filename: string): void {
  const filePath = path.join(UPLOAD_PATH, filename)
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
  
  // 同时尝试删除缩略图
  const thumbPath = path.join(UPLOAD_PATH, `thumb_${filename}`)
  if (fs.existsSync(thumbPath)) {
    fs.unlinkSync(thumbPath)
  }
}

/**
 * 获取上传文件的完整路径
 */
export function getUploadPath(filename: string): string {
  return path.join(UPLOAD_PATH, filename)
}

export default {
  uploadSingle,
  uploadMultiple,
  handleUploadError,
  deleteUploadedFile,
  getUploadPath,
  UPLOAD_PATH,
  ALLOWED_TYPES,
  MAX_FILE_SIZE,
  MAX_FILES
}
