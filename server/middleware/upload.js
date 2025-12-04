import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 上传目录
const UPLOAD_PATH = process.env.UPLOAD_PATH || path.join(__dirname, '../../uploads/photos')

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true })
}

// 允许的文件类型
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

// 最大文件大小 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

// 单次最多上传文件数
const MAX_FILES = 20

/**
 * 配置文件存储
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_PATH)
  },
  filename: (req, file, cb) => {
    // 生成 UUID 文件名，保留原扩展名
    const ext = path.extname(file.originalname).toLowerCase()
    const filename = `${uuidv4()}${ext}`
    cb(null, filename)
  }
})

/**
 * 文件过滤器 - 验证文件类型
 */
const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${ALLOWED_TYPES.join(', ')}`), false)
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
export function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
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
    
    return res.status(400).json({
      success: false,
      error: message
    })
  } else if (err) {
    // 其他错误（如文件类型验证错误）
    return res.status(400).json({
      success: false,
      error: err.message
    })
  }
  
  next()
}

/**
 * 删除上传的文件
 * @param {string} filename - 文件名
 */
export function deleteUploadedFile(filename) {
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
 * @param {string} filename - 文件名
 * @returns {string} 完整路径
 */
export function getUploadPath(filename) {
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
