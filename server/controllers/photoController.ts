import type { Response } from 'express'
import { Photo } from '../models/index.js'
import { deleteUploadedFile } from '../middleware/upload.js'
import sharp from 'sharp'
import path from 'path'
import type { AuthenticatedRequest, PhotoQueryParams, MulterFile } from '../types/index.js'
import { loadConfig } from './configController.js'

// 请求体类型定义
interface TagsUpdateBody {
  tags: string[]
}

interface BatchDeleteBody {
  ids: number[]
}

interface BatchUpdateTagsBody {
  ids: number[]
  tags: string[]
}

interface UploadError {
  filename: string
  error: string
}

interface BatchError {
  id: number
  error: string
}

function verifyTagName(name: string): boolean {
  // 只允许中英文、数字、下划线和减号
  const regex = /^[\w\u4e00-\u9fa5\-]+$/
  return regex.test(name)
}

function filterTagName(name: string): string {
  // 移除特殊字符，只保留中英文、数字、下划线和减号
  return name.replace(/[^\w\u4e00-\u9fa5\-]/g, '')
}

/**
 * 解析标签字符串
 * 过滤掉特殊字符，只保留中英文、数字、下划线和减号
 */
function parseTags(tagsStr: string | undefined): string[] {
  if (!tagsStr) return []
  const regex = /#([^\s#]+)/g
  const matches = tagsStr.matchAll(regex)
  const tags = new Set<string>()
  
  for (const match of matches) {
    // 移除特殊字符，只保留中英文、数字、下划线和减号
    const tag = filterTagName(match[1].trim())
    if (tag) {
      tags.add(tag)
    }
  }
  
  return Array.from(tags)
}

interface ImageDimensions {
  width: number | null
  height: number | null
}

/**
 * 获取图片元数据并生成缩略图
 */
async function processImage(filePath: string, filename: string): Promise<ImageDimensions> {
  try {
    const image = sharp(filePath)
    const metadata = await image.metadata()
    
    // 生成缩略图
    const thumbFilename = `thumb_${filename}`
    const thumbPath = path.join(path.dirname(filePath), thumbFilename)
    
    await image
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(thumbPath)
    
    return {
      width: metadata.width ?? null,
      height: metadata.height ?? null
    }
  } catch (error) {
    console.error('Process image error:', error)
    return { width: null, height: null }
  }
}

/**
 * 获取图片列表
 * GET /api/photos
 */
export async function getPhotos(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { page = '1', limit = '20', tags, sort = 'created_at_desc', userId, userIds } = req.query as {
      page?: string
      limit?: string
      tags?: string
      sort?: PhotoQueryParams['sort']
      userId?: string
      userIds?: string
    }
    
    // 解析标签参数
    let tagArray: string[] = []
    if (tags) {
      tagArray = tags.split(',').map(t => t.trim()).filter(t => t)
    }

    // 解析用户ID列表
    let userIdArray: number[] = []
    if (userIds) {
      userIdArray = userIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
    }
    
    // 默认只显示已审核通过的图片，除非是查询自己的图片或者管理员查询
    // 但这里是公共接口，通常只返回 approved。
    // 如果需要查询 pending，应该使用专门的接口或者参数（仅限管理员或本人）
    // 简单起见，公共流只返回 approved
    
    const result = Photo.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      tags: tagArray,
      sort,
      userId: userId ? parseInt(userId) : undefined,
      userIds: userIdArray.length > 0 ? userIdArray : undefined,
      status: 'approved'
    })
    
    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Get photos error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get photos'
    })
  }
}

/**
 * 获取当前用户的图片
 * GET /api/photos/my
 */
export async function getMyPhotos(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
      return
    }

    const { page = '1', limit = '20', tags, sort = 'created_at_desc' } = req.query as {
      page?: string
      limit?: string
      tags?: string
      sort?: PhotoQueryParams['sort']
    }
    
    // 解析标签参数
    let tagArray: string[] = []
    if (tags) {
      tagArray = tags.split(',').map(t => t.trim()).filter(t => t)
    }
    
    const result = Photo.findByUserId(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      tags: tagArray,
      sort
    })
    
    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Get my photos error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get photos'
    })
  }
}

/**
 * 获取单张图片详情
 * GET /api/photos/:id
 */
export async function getPhotoById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const photo = Photo.findById(parseInt(id))
    
    if (!photo) {
      res.status(404).json({
        success: false,
        error: 'Photo not found'
      })
      return
    }
    
    res.json({
      success: true,
      data: photo
    })
  } catch (error) {
    console.error('Get photo by id error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get photo'
    })
  }
}

/**
 * 上传图片
 * POST /api/photos
 */
export async function uploadPhotos(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
      return
    }

    // 使用类型断言处理 multer 添加的 files/file 属性
    const reqFiles = (req as AuthenticatedRequest & { files?: MulterFile[]; file?: MulterFile }).files
    const reqFile = (req as AuthenticatedRequest & { files?: MulterFile[]; file?: MulterFile }).file
    const files = reqFiles || (reqFile ? [reqFile] : [])
    const { tags: tagsStr } = req.body as { tags?: string }
    
    if (files.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No files uploaded'
      })
      return
    }
    
    // 解析标签
    const tagNames = parseTags(tagsStr)
    
    // 获取系统配置
    const config = await loadConfig()
    // 如果开启了审核且不是管理员，则状态为 pending
    const status = (config.uploadReview && req.user.role !== 'admin') ? 'pending' : 'approved'

    const uploadedPhotos: any[] = []
    const errors: UploadError[] = []
    
    for (const file of files) {
      try {
        // 处理图片（获取尺寸、生成缩略图）
        const { width, height } = await processImage(file.path, file.filename)
        
        // 创建图片记录
        const photo = Photo.create({
          userId: req.user.id,
          filename: file.filename,
          originalName: file.originalname,
          filePath: `photos/${file.filename}`,
          fileSize: file.size,
          mimeType: file.mimetype,
          width: width ?? undefined,
          height: height ?? undefined,
          status
        })
        
        if (photo) {
          // 添加标签
          if (tagNames.length > 0) {
            Photo.updateTags(photo.id, tagNames)
            photo.tags = tagNames.map(name => ({ id: 0, name, createdAt: new Date().toISOString() }))
          }
          
          // 添加 URL
          photo.url = `/uploads/photos/${file.filename}`
          photo.thumbnailUrl = `/uploads/photos/thumb_${file.filename}`
          
          uploadedPhotos.push(photo)
        }
      } catch (error) {
        console.error('Upload single photo error:', error)
        errors.push({
          filename: file.originalname,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        // 删除上传失败的文件
        deleteUploadedFile(file.filename)
      }
    }
    
    res.status(201).json({
      success: true,
      data: {
        photos: uploadedPhotos,
        errors: errors.length > 0 ? errors : undefined
      }
    })
  } catch (error) {
    console.error('Upload photos error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to upload photos'
    })
  }
}

/**
 * 更新图片标签
 * PUT /api/photos/:id/tags
 */
export async function updatePhotoTags(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
      return
    }

    const { id } = req.params
    const { tags } = req.body as TagsUpdateBody
    const photoId = parseInt(id)
    
    // 验证参数
    if (!Array.isArray(tags)) {
      res.status(400).json({
        success: false,
        error: 'Tags must be an array'
      })
      return
    }

    for (const tag of tags) {
      if (!verifyTagName(tag)) {
        res.status(400).json({
          success: false,
          error: `Invalid tag name: ${tag}`
        })
        return
      }
    }

    // 检查图片是否存在
    const photo = Photo.findById(photoId)
    if (!photo) {
      res.status(404).json({
        success: false,
        error: 'Photo not found'
      })
      return
    }
    
    // 检查权限（所有者或管理员）
    if (photo.userId !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      })
      return
    }
    
    // 更新标签
    Photo.updateTags(photoId, tags)
    
    res.json({
      success: true,
      data: {
        id: photoId,
        tags
      }
    })
  } catch (error) {
    console.error('Update photo tags error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update tags'
    })
  }
}

/**
 * 删除图片
 * DELETE /api/photos/:id
 */
export async function deletePhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
      return
    }

    const { id } = req.params
    const photoId = parseInt(id)
    
    // 检查图片是否存在
    const photo = Photo.findById(photoId)
    if (!photo) {
      res.status(404).json({
        success: false,
        error: 'Photo not found'
      })
      return
    }
    
    // 检查权限（所有者或管理员）
    if (photo.userId !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      })
      return
    }
    
    // 删除文件
    deleteUploadedFile(photo.filename)
    
    // 删除数据库记录
    Photo.delete(photoId)
    
    res.json({
      success: true,
      message: 'Photo deleted successfully'
    })
  } catch (error) {
    console.error('Delete photo error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete photo'
    })
  }
}

/**
 * 批量删除图片
 * DELETE /api/photos/batch
 */
export async function batchDeletePhotos(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
      return
    }

    const { ids } = req.body as BatchDeleteBody
    
    // 验证参数
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({
        success: false,
        error: 'IDs must be a non-empty array'
      })
      return
    }
    
    const deletedIds: number[] = []
    const errors: BatchError[] = []
    
    for (const id of ids) {
      try {
        const photoId = typeof id === 'string' ? parseInt(id) : id
        const photo = Photo.findById(photoId)
        
        if (!photo) {
          errors.push({ id: photoId, error: 'Photo not found' })
          continue
        }
        
        // 检查权限（所有者或管理员）
        if (photo.userId !== req.user!.id && req.user!.role !== 'admin') {
          errors.push({ id: photoId, error: 'Access denied' })
          continue
        }
        
        // 删除文件
        deleteUploadedFile(photo.filename)
        
        // 删除数据库记录
        Photo.delete(photoId)
        deletedIds.push(photoId)
      } catch (error) {
        errors.push({ id, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }
    
    res.json({
      success: true,
      data: {
        deletedIds,
        errors: errors.length > 0 ? errors : undefined
      }
    })
  } catch (error) {
    console.error('Batch delete photos error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete photos'
    })
  }
}

/**
 * 批量更新图片标签
 * PUT /api/photos/batch/tags
 */
export async function batchUpdateTags(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
      return
    }

    const { ids, tags } = req.body as BatchUpdateTagsBody
    
    // 验证参数
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({
        success: false,
        error: 'IDs must be a non-empty array'
      })
      return
    }

    for (const tag of tags) {
      if (!verifyTagName(tag)) {
        res.status(400).json({
          success: false,
          error: `Invalid tag name: ${tag}`
        })
        return
      }
    }
    
    if (!Array.isArray(tags)) {
      res.status(400).json({
        success: false,
        error: 'Tags must be an array'
      })
      return
    }
    
    const updatedIds: number[] = []
    const errors: BatchError[] = []
    
    for (const id of ids) {
      try {
        const photoId = typeof id === 'string' ? parseInt(id) : id
        const photo = Photo.findById(photoId)
        
        if (!photo) {
          errors.push({ id: photoId, error: 'Photo not found' })
          continue
        }
        
        // 检查权限（所有者或管理员）
        if (photo.userId !== req.user!.id && req.user!.role !== 'admin') {
          errors.push({ id: photoId, error: 'Access denied' })
          continue
        }
        
        // 更新标签
        Photo.updateTags(photoId, tags)
        updatedIds.push(photoId)
      } catch (error) {
        errors.push({ id, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }
    
    res.json({
      success: true,
      data: {
        updatedIds,
        tags,
        errors: errors.length > 0 ? errors : undefined
      }
    })
  } catch (error) {
    console.error('Batch update tags error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update tags'
    })
  }
}

/**
 * 获取待审核图片列表 (Admin only)
 * GET /api/photos/pending
 */
export async function getPendingPhotos(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Forbidden' })
      return
    }
    const { page = '1', limit = '20' } = req.query as { page?: string, limit?: string }
    const result = Photo.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      status: 'pending'
    })
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Get pending photos error:', error)
    res.status(500).json({ success: false, error: 'Failed to get pending photos' })
  }
}

/**
 * 审核图片 (Admin only)
 * POST /api/photos/:id/review
 */
export async function reviewPhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Forbidden' })
      return
    }
    const { id } = req.params
    const { action } = req.body // 'approve' | 'reject'
    
    if (!['approve', 'reject'].includes(action)) {
      res.status(400).json({ success: false, error: 'Invalid action' })
      return
    }

    const status = action === 'approve' ? 'approved' : 'rejected'
    const photo = Photo.updateStatus(parseInt(id), status)
    
    if (!photo) {
      res.status(404).json({ success: false, error: 'Photo not found' })
      return
    }
    
    res.json({ success: true, data: photo })
  } catch (error) {
    console.error('Review photo error:', error)
    res.status(500).json({ success: false, error: 'Failed to review photo' })
  }
}

/**
 * 批量审核图片 (Admin only)
 * POST /api/photos/batch/review
 */
export async function batchReviewPhotos(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Forbidden' })
      return
    }
    
    const { ids, action } = req.body // ids: number[], action: 'approve' | 'reject'
    
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, error: 'Invalid ids' })
      return
    }

    if (!['approve', 'reject'].includes(action)) {
      res.status(400).json({ success: false, error: 'Invalid action' })
      return
    }

    const status = action === 'approve' ? 'approved' : 'rejected'
    const count = Photo.batchUpdateStatus(ids, status)
    
    res.json({ success: true, data: { count } })
  } catch (error) {
    console.error('Batch review photos error:', error)
    res.status(500).json({ success: false, error: 'Failed to batch review photos' })
  }
}

export default {
  getPhotos,
  getMyPhotos,
  getPhotoById,
  uploadPhotos,
  updatePhotoTags,
  deletePhoto,
  batchDeletePhotos,
  batchUpdateTags
}
