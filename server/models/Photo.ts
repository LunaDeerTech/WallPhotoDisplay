import db from '../config/database.js'
import type { PhotoCreateInput, PhotoQueryParams, PhotoPaginatedResult, PaginationInfo } from '../types/index.js'

// 数据库返回的照片行类型
interface PhotoRow {
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
}

// 标签完整信息类型
interface TagRow {
  id: number
  name: string
  createdAt: string
}

// 带 tags 的照片响应类型
interface PhotoWithTags extends PhotoRow {
  tags: TagRow[]
  url?: string
  thumbnailUrl?: string
  likeCount?: number
  isLiked?: boolean
}

interface TagIdRow {
  id: number
}

interface CountRow {
  count: number
  total?: number
}

/**
 * Photo 模型 - 图片相关数据库操作
 */
const Photo = {
  /**
   * 创建新图片记录
   */
  create({ userId, filename, originalName, filePath, fileSize, mimeType, width, height, status = 'approved' }: PhotoCreateInput): PhotoWithTags | null {
    const stmt = db.prepare(`
      INSERT INTO photos (user_id, filename, original_name, file_path, file_size, mime_type, width, height, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    const result = stmt.run(userId, filename, originalName, filePath, fileSize, mimeType, width, height, status)
    
    return this.findById(result.lastInsertRowid as number)
  },

  /**
   * 根据 ID 查找图片
   */
  findById(id: number, currentUserId?: number): PhotoWithTags | null {
    const stmt = db.prepare(`
      SELECT 
        p.id, p.user_id as userId, p.filename, p.original_name as originalName,
        p.file_path as filePath, p.file_size as fileSize, p.mime_type as mimeType,
        p.width, p.height, p.status, p.created_at as createdAt, p.updated_at as updatedAt,
        u.display_name as uploaderName, u.is_banned as isBanned
      FROM photos p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `)
    
    const photo = stmt.get(id) as (PhotoRow & { status: 'pending' | 'approved' | 'rejected', isBanned: number }) | undefined
    if (!photo) return null
    
    // 检查图片上传者是否被封禁
    if (photo.isBanned === 1) {
      return null
    }
    
    // 获取图片标签和点赞信息
    const likeCount = this.getLikeCount(id)
    const isLiked = currentUserId ? this.isLikedByUser(id, currentUserId) : false
    
    const photoWithTags: PhotoWithTags & { status: 'pending' | 'approved' | 'rejected' } = {
      ...photo,
      tags: this.getTags(id),
      likeCount,
      isLiked
    }
    return photoWithTags
  },

  /**
   * 获取图片列表（支持分页、筛选、排序）
   */
  findAll({ page = 1, limit = 20, tags = [], sort = 'created_at_desc', userId, userIds, status, currentUserId }: PhotoQueryParams & { currentUserId?: number } = {}): PhotoPaginatedResult {
    let whereClause = 'WHERE 1=1'
    const params: (string | number)[] = []

    // 状态筛选
    if (status) {
      whereClause += ' AND p.status = ?'
      params.push(status)
    }

    // 用户筛选
    if (userId) {
      whereClause += ' AND p.user_id = ?'
      params.push(userId)
    }

    // 多用户筛选
    if (userIds && userIds.length > 0) {
      const placeholders = userIds.map(() => '?').join(',')
      whereClause += ` AND p.user_id IN (${placeholders})`
      params.push(...userIds)
    }

    // 标签筛选（图片需要包含所有指定标签）
    if (tags && tags.length > 0) {
      whereClause += ` AND p.id IN (
        SELECT pt.photo_id FROM photo_tags pt
        JOIN tags t ON pt.tag_id = t.id
        WHERE t.name IN (${tags.map(() => '?').join(',')})
        GROUP BY pt.photo_id
        HAVING COUNT(DISTINCT t.id) = ?
      )`
      params.push(...tags, tags.length)
    }

    // 排序
    let orderClause = 'ORDER BY p.created_at DESC'
    switch (sort) {
      case 'created_at_asc':
        orderClause = 'ORDER BY p.created_at ASC'
        break
      case 'created_at_desc':
        orderClause = 'ORDER BY p.created_at DESC'
        break
      case 'random':
        orderClause = 'ORDER BY RANDOM()'
        break
    }

    // 添加封禁用户过滤（总是排除被封禁用户的图片）
    whereClause += ' AND p.user_id NOT IN (SELECT id FROM users WHERE is_banned = 1)'

    // 获取总数
    const countStmt = db.prepare(`
      SELECT COUNT(DISTINCT p.id) as total
      FROM photos p
      ${whereClause}
    `)
    const { total } = countStmt.get(...params) as CountRow & { total: number }

    // 分页
    const offset = (page - 1) * limit
    
    // 查询图片
    const stmt = db.prepare(`
      SELECT DISTINCT
        p.id, p.user_id as userId, p.filename, p.original_name as originalName,
        p.file_path as filePath, p.file_size as fileSize, p.mime_type as mimeType,
        p.width, p.height, p.status, p.created_at as createdAt, p.updated_at as updatedAt,
        u.display_name as uploaderName
      FROM photos p
      LEFT JOIN users u ON p.user_id = u.id
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `)
    
    const photoRows = stmt.all(...params, limit, offset) as PhotoRow[]
    
    // 获取每张图片的标签和点赞信息
    const photos: PhotoWithTags[] = photoRows.map(photo => {
      const likeCount = this.getLikeCount(photo.id)
      const isLiked = currentUserId ? this.isLikedByUser(photo.id, currentUserId) : false
      
      return {
        ...photo,
        tags: this.getTags(photo.id),
        url: `/uploads/${photo.filename}`,
        thumbnailUrl: `/uploads/thumb_${photo.filename}`,
        likeCount,
        isLiked
      }
    })

    const pagination: PaginationInfo = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }

    return {
      photos: photos as any[], // PhotoWithTags 兼容 PhotoResponse[]
      pagination
    }
  },

  /**
   * 获取用户的所有图片
   */
  findByUserId(userId: number, options: Omit<PhotoQueryParams, 'userId'> & { currentUserId?: number } = {}): PhotoPaginatedResult {
    return this.findAll({ ...options, userId })
  },

  /**
   * 获取图片的标签（返回完整标签对象）
   */
  getTags(photoId: number): TagRow[] {
    const stmt = db.prepare(`
      SELECT t.id, t.name, t.created_at as createdAt FROM tags t
      JOIN photo_tags pt ON t.id = pt.tag_id
      WHERE pt.photo_id = ?
    `)
    return stmt.all(photoId) as TagRow[]
  },

  /**
   * 更新图片状态
   */
  updateStatus(id: number, status: 'pending' | 'approved' | 'rejected'): PhotoWithTags | null {
    const stmt = db.prepare('UPDATE photos SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    const result = stmt.run(status, id)
    if (result.changes === 0) return null
    return this.findById(id)
  },

  /**
   * 更新图片标签
   */
  updateTags(photoId: number, tags: string[]): PhotoWithTags | null {
    const transaction = db.transaction(() => {
      // 删除原有标签关联
      const deleteStmt = db.prepare('DELETE FROM photo_tags WHERE photo_id = ?')
      deleteStmt.run(photoId)

      // 添加新标签
      if (tags && tags.length > 0) {
        const insertTagStmt = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)')
        const getTagIdStmt = db.prepare('SELECT id FROM tags WHERE name = ?')
        const insertPhotoTagStmt = db.prepare('INSERT OR IGNORE INTO photo_tags (photo_id, tag_id) VALUES (?, ?)')

        // 使用 Set 去重，避免重复标签
        const uniqueTags = [...new Set(tags.map(t => t.trim()).filter(t => t))]
        
        for (const trimmedName of uniqueTags) {
          // 确保标签存在（如果不存在则自动创建）
          insertTagStmt.run(trimmedName)
          
          // 获取标签 ID
          const tag = getTagIdStmt.get(trimmedName) as TagIdRow
          
          // 创建关联
          insertPhotoTagStmt.run(photoId, tag.id)
        }
      }

      // 更新图片的 updated_at
      const updateStmt = db.prepare('UPDATE photos SET updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      updateStmt.run(photoId)
    })

    transaction()
    return this.findById(photoId)
  },

  /**
   * 批量更新图片标签
   */
  batchUpdateTags(photoIds: number[], tags: string[]): number {
    const transaction = db.transaction(() => {
      for (const photoId of photoIds) {
        this.updateTags(photoId, tags)
      }
    })

    transaction()
    return photoIds.length
  },

  /**
   * 批量更新图片状态
   */
  batchUpdateStatus(ids: number[], status: 'pending' | 'approved' | 'rejected'): number {
    if (ids.length === 0) return 0
    
    const placeholders = ids.map(() => '?').join(',')
    const stmt = db.prepare(`UPDATE photos SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`)
    
    const result = stmt.run(status, ...ids)
    return result.changes
  },

  /**
   * 删除图片
   */
  delete(id: number): PhotoWithTags | null {
    const photo = this.findById(id)
    if (!photo) return null

    const stmt = db.prepare('DELETE FROM photos WHERE id = ?')
    stmt.run(id)
    
    return photo
  },

  /**
   * 批量删除图片
   */
  batchDelete(ids: number[]): PhotoWithTags[] {
    const deletedPhotos: PhotoWithTags[] = []
    
    const transaction = db.transaction(() => {
      for (const id of ids) {
        const photo = this.delete(id)
        if (photo) {
          deletedPhotos.push(photo)
        }
      }
    })

    transaction()
    return deletedPhotos
  },

  /**
   * 检查图片是否属于指定用户
   */
  belongsToUser(photoId: number, userId: number): boolean {
    const stmt = db.prepare('SELECT 1 FROM photos WHERE id = ? AND user_id = ?')
    return !!stmt.get(photoId, userId)
  },

  /**
   * 获取图片数量
   */
  count(userId?: number): number {
    let sql = 'SELECT COUNT(*) as count FROM photos'
    const params: number[] = []
    
    if (userId) {
      sql += ' WHERE user_id = ?'
      params.push(userId)
    }
    
    const stmt = db.prepare(sql)
    return (stmt.get(...params) as CountRow).count
  },

  /**
   * 获取图片点赞数
   */
  getLikeCount(photoId: number): number {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM likes WHERE photo_id = ?')
    const result = stmt.get(photoId) as CountRow
    return result.count
  },

  /**
   * 检查用户是否点赞了图片
   */
  isLikedByUser(photoId: number, userId: number): boolean {
    const stmt = db.prepare('SELECT 1 FROM likes WHERE photo_id = ? AND user_id = ?')
    return !!stmt.get(photoId, userId)
  },

  /**
   * 点赞图片
   */
  likePhoto(photoId: number, userId: number): boolean {
    try {
      const stmt = db.prepare('INSERT OR IGNORE INTO likes (photo_id, user_id) VALUES (?, ?)')
      const result = stmt.run(photoId, userId)
      return result.changes > 0
    } catch (error) {
      // 如果是唯一约束冲突，说明已经点赞过
      return false
    }
  },

  /**
   * 取消点赞
   */
  unlikePhoto(photoId: number, userId: number): boolean {
    const stmt = db.prepare('DELETE FROM likes WHERE photo_id = ? AND user_id = ?')
    const result = stmt.run(photoId, userId)
    return result.changes > 0
  },

  /**
   * 获取图片的点赞用户ID列表
   */
  getLikedUserIds(photoId: number): number[] {
    const stmt = db.prepare('SELECT user_id FROM likes WHERE photo_id = ?')
    const rows = stmt.all(photoId) as Array<{ user_id: number }>
    return rows.map(row => row.user_id)
  }
}

export default Photo
