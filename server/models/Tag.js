import db from '../config/database.js'

/**
 * Tag 模型 - 标签相关数据库操作
 */
const Tag = {
  /**
   * 创建新标签
   * @param {string} name - 标签名称（不含 #）
   * @returns {Object} 创建的标签对象
   */
  create(name) {
    const trimmedName = name.trim()
    if (!trimmedName) return null

    const stmt = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)')
    stmt.run(trimmedName)

    return this.findByName(trimmedName)
  },

  /**
   * 根据 ID 查找标签
   * @param {number} id - 标签 ID
   * @returns {Object|null} 标签对象
   */
  findById(id) {
    const stmt = db.prepare(`
      SELECT id, name, created_at as createdAt FROM tags WHERE id = ?
    `)
    return stmt.get(id) || null
  },

  /**
   * 根据名称查找标签
   * @param {string} name - 标签名称
   * @returns {Object|null} 标签对象
   */
  findByName(name) {
    const stmt = db.prepare(`
      SELECT id, name, created_at as createdAt FROM tags WHERE name = ?
    `)
    return stmt.get(name.trim()) || null
  },

  /**
   * 获取所有标签（带使用次数）
   * @returns {Array} 标签列表
   */
  findAll() {
    const stmt = db.prepare(`
      SELECT 
        t.id, t.name, t.created_at as createdAt,
        COUNT(pt.photo_id) as count
      FROM tags t
      LEFT JOIN photo_tags pt ON t.id = pt.tag_id
      GROUP BY t.id
      ORDER BY count DESC, t.name ASC
    `)
    return stmt.all()
  },

  /**
   * 随机获取标签
   * @param {number} [limit=10] - 返回数量
   * @returns {Array} 随机标签列表
   */
  findRandom(limit = 10) {
    const stmt = db.prepare(`
      SELECT 
        t.id, t.name, t.created_at as createdAt,
        COUNT(pt.photo_id) as count
      FROM tags t
      LEFT JOIN photo_tags pt ON t.id = pt.tag_id
      GROUP BY t.id
      HAVING count > 0
      ORDER BY RANDOM()
      LIMIT ?
    `)
    return stmt.all(limit)
  },

  /**
   * 搜索标签
   * @param {string} keyword - 搜索关键词
   * @param {number} [limit=20] - 返回数量
   * @returns {Array} 匹配的标签列表
   */
  search(keyword, limit = 20) {
    const stmt = db.prepare(`
      SELECT 
        t.id, t.name, t.created_at as createdAt,
        COUNT(pt.photo_id) as count
      FROM tags t
      LEFT JOIN photo_tags pt ON t.id = pt.tag_id
      WHERE t.name LIKE ?
      GROUP BY t.id
      ORDER BY count DESC, t.name ASC
      LIMIT ?
    `)
    return stmt.all(`%${keyword}%`, limit)
  },

  /**
   * 批量创建或获取标签
   * @param {string[]} names - 标签名称数组
   * @returns {Object[]} 标签对象数组
   */
  findOrCreateMany(names) {
    const tags = []
    
    const transaction = db.transaction(() => {
      const insertStmt = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)')
      const selectStmt = db.prepare('SELECT id, name, created_at as createdAt FROM tags WHERE name = ?')

      for (const name of names) {
        const trimmedName = name.trim()
        if (!trimmedName) continue
        
        insertStmt.run(trimmedName)
        const tag = selectStmt.get(trimmedName)
        if (tag) {
          tags.push(tag)
        }
      }
    })

    transaction()
    return tags
  },

  /**
   * 获取图片的所有标签
   * @param {number} photoId - 图片 ID
   * @returns {Object[]} 标签对象数组
   */
  findByPhotoId(photoId) {
    const stmt = db.prepare(`
      SELECT t.id, t.name, t.created_at as createdAt
      FROM tags t
      JOIN photo_tags pt ON t.id = pt.tag_id
      WHERE pt.photo_id = ?
    `)
    return stmt.all(photoId)
  },

  /**
   * 为图片添加标签
   * @param {number} photoId - 图片 ID
   * @param {number} tagId - 标签 ID
   * @returns {boolean} 是否添加成功
   */
  addToPhoto(photoId, tagId) {
    const stmt = db.prepare('INSERT OR IGNORE INTO photo_tags (photo_id, tag_id) VALUES (?, ?)')
    const result = stmt.run(photoId, tagId)
    return result.changes > 0
  },

  /**
   * 从图片移除标签
   * @param {number} photoId - 图片 ID
   * @param {number} tagId - 标签 ID
   * @returns {boolean} 是否移除成功
   */
  removeFromPhoto(photoId, tagId) {
    const stmt = db.prepare('DELETE FROM photo_tags WHERE photo_id = ? AND tag_id = ?')
    const result = stmt.run(photoId, tagId)
    return result.changes > 0
  },

  /**
   * 删除标签（如果没有被任何图片使用）
   * @param {number} id - 标签 ID
   * @returns {boolean} 是否删除成功
   */
  delete(id) {
    // 检查是否有图片使用此标签
    const checkStmt = db.prepare('SELECT COUNT(*) as count FROM photo_tags WHERE tag_id = ?')
    const { count } = checkStmt.get(id)
    
    if (count > 0) {
      return false
    }

    const stmt = db.prepare('DELETE FROM tags WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  },

  /**
   * 清理未使用的标签
   * @returns {number} 删除的标签数量
   */
  cleanupUnused() {
    const stmt = db.prepare(`
      DELETE FROM tags WHERE id NOT IN (
        SELECT DISTINCT tag_id FROM photo_tags
      )
    `)
    const result = stmt.run()
    return result.changes
  },

  /**
   * 获取标签数量
   * @returns {number} 标签总数
   */
  count() {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM tags')
    return stmt.get().count
  },

  /**
   * 获取有图片关联的标签数量
   * @returns {number} 标签总数
   */
  countUsed() {
    const stmt = db.prepare(`
      SELECT COUNT(DISTINCT tag_id) as count FROM photo_tags
    `)
    return stmt.get().count
  },

  /**
   * 解析标签字符串
   * 从 "#标签1 #标签2 #标签3" 格式解析出标签数组
   * @param {string} input - 输入字符串
   * @returns {string[]} 标签名称数组
   */
  parseTags(input) {
    if (!input) return []
    
    const regex = /#([^\s#]+)/g
    const matches = input.matchAll(regex)
    const tags = new Set()

    for (const match of matches) {
      const tag = match[1].trim()
      if (tag) {
        tags.add(tag)
      }
    }

    return Array.from(tags)
  }
}

export default Tag
