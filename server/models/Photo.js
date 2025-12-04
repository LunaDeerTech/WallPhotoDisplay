import db from '../config/database.js'

/**
 * Photo 模型 - 图片相关数据库操作
 */
const Photo = {
  /**
   * 创建新图片记录
   * @param {Object} photoData - 图片数据
   * @param {number} photoData.userId - 上传用户 ID
   * @param {string} photoData.filename - 存储的文件名 (UUID)
   * @param {string} [photoData.originalName] - 原始文件名
   * @param {string} photoData.filePath - 相对存储路径
   * @param {number} [photoData.fileSize] - 文件大小 (bytes)
   * @param {string} [photoData.mimeType] - MIME 类型
   * @param {number} [photoData.width] - 图片宽度
   * @param {number} [photoData.height] - 图片高度
   * @returns {Object} 创建的图片对象
   */
  create({ userId, filename, originalName, filePath, fileSize, mimeType, width, height }) {
    const stmt = db.prepare(`
      INSERT INTO photos (user_id, filename, original_name, file_path, file_size, mime_type, width, height)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    const result = stmt.run(userId, filename, originalName, filePath, fileSize, mimeType, width, height)
    
    return this.findById(result.lastInsertRowid)
  },

  /**
   * 根据 ID 查找图片
   * @param {number} id - 图片 ID
   * @returns {Object|null} 图片对象
   */
  findById(id) {
    const stmt = db.prepare(`
      SELECT 
        p.id, p.user_id as userId, p.filename, p.original_name as originalName,
        p.file_path as filePath, p.file_size as fileSize, p.mime_type as mimeType,
        p.width, p.height, p.created_at as createdAt, p.updated_at as updatedAt,
        u.display_name as uploaderName
      FROM photos p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `)
    
    const photo = stmt.get(id)
    if (!photo) return null
    
    // 获取图片标签
    photo.tags = this.getTags(id)
    return photo
  },

  /**
   * 获取图片列表（支持分页、筛选、排序）
   * @param {Object} options - 查询选项
   * @param {number} [options.page=1] - 页码
   * @param {number} [options.limit=20] - 每页数量
   * @param {string[]} [options.tags] - 标签筛选
   * @param {string} [options.sort='created_at_desc'] - 排序方式
   * @param {number} [options.userId] - 用户筛选
   * @returns {Object} { photos, pagination }
   */
  findAll({ page = 1, limit = 20, tags = [], sort = 'created_at_desc', userId } = {}) {
    let whereClause = 'WHERE 1=1'
    const params = []

    // 用户筛选
    if (userId) {
      whereClause += ' AND p.user_id = ?'
      params.push(userId)
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

    // 获取总数
    const countStmt = db.prepare(`
      SELECT COUNT(DISTINCT p.id) as total
      FROM photos p
      ${whereClause}
    `)
    const { total } = countStmt.get(...params)

    // 分页
    const offset = (page - 1) * limit
    
    // 查询图片
    const stmt = db.prepare(`
      SELECT DISTINCT
        p.id, p.user_id as userId, p.filename, p.original_name as originalName,
        p.file_path as filePath, p.file_size as fileSize, p.mime_type as mimeType,
        p.width, p.height, p.created_at as createdAt, p.updated_at as updatedAt,
        u.display_name as uploaderName
      FROM photos p
      LEFT JOIN users u ON p.user_id = u.id
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `)
    
    const photos = stmt.all(...params, limit, offset)
    
    // 获取每张图片的标签
    photos.forEach(photo => {
      photo.tags = this.getTags(photo.id)
      photo.url = `/uploads/photos/${photo.filename}`
      photo.thumbnailUrl = `/uploads/photos/thumb_${photo.filename}`
    })

    return {
      photos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  },

  /**
   * 获取用户的所有图片
   * @param {number} userId - 用户 ID
   * @param {Object} options - 查询选项
   * @returns {Object} { photos, pagination }
   */
  findByUserId(userId, options = {}) {
    return this.findAll({ ...options, userId })
  },

  /**
   * 获取图片的标签
   * @param {number} photoId - 图片 ID
   * @returns {string[]} 标签名称数组
   */
  getTags(photoId) {
    const stmt = db.prepare(`
      SELECT t.name FROM tags t
      JOIN photo_tags pt ON t.id = pt.tag_id
      WHERE pt.photo_id = ?
    `)
    return stmt.all(photoId).map(row => row.name)
  },

  /**
   * 更新图片标签
   * @param {number} photoId - 图片 ID
   * @param {string[]} tags - 新的标签数组
   * @returns {Object|null} 更新后的图片对象
   */
  updateTags(photoId, tags) {
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
          const tag = getTagIdStmt.get(trimmedName)
          
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
   * @param {number[]} photoIds - 图片 ID 数组
   * @param {string[]} tags - 新的标签数组
   * @returns {number} 更新的图片数量
   */
  batchUpdateTags(photoIds, tags) {
    const transaction = db.transaction(() => {
      for (const photoId of photoIds) {
        this.updateTags(photoId, tags)
      }
    })

    transaction()
    return photoIds.length
  },

  /**
   * 删除图片
   * @param {number} id - 图片 ID
   * @returns {Object|null} 被删除的图片对象（用于删除文件）
   */
  delete(id) {
    const photo = this.findById(id)
    if (!photo) return null

    const stmt = db.prepare('DELETE FROM photos WHERE id = ?')
    stmt.run(id)
    
    return photo
  },

  /**
   * 批量删除图片
   * @param {number[]} ids - 图片 ID 数组
   * @returns {Object[]} 被删除的图片对象数组
   */
  batchDelete(ids) {
    const deletedPhotos = []
    
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
   * @param {number} photoId - 图片 ID
   * @param {number} userId - 用户 ID
   * @returns {boolean}
   */
  belongsToUser(photoId, userId) {
    const stmt = db.prepare('SELECT 1 FROM photos WHERE id = ? AND user_id = ?')
    return !!stmt.get(photoId, userId)
  },

  /**
   * 获取图片数量
   * @param {number} [userId] - 可选的用户 ID 筛选
   * @returns {number} 图片总数
   */
  count(userId) {
    let sql = 'SELECT COUNT(*) as count FROM photos'
    const params = []
    
    if (userId) {
      sql += ' WHERE user_id = ?'
      params.push(userId)
    }
    
    const stmt = db.prepare(sql)
    return stmt.get(...params).count
  }
}

export default Photo
