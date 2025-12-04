import db from '../config/database.js'

// 数据库返回的标签行类型
interface TagRow {
  id: number
  name: string
  createdAt: string
}

interface TagWithCount extends TagRow {
  count: number
}

interface CountRow {
  count: number
}

/**
 * Tag 模型 - 标签相关数据库操作
 */
const Tag = {
  /**
   * 创建新标签
   */
  create(name: string): TagRow | null {
    const trimmedName = name.trim()
    if (!trimmedName) return null

    const stmt = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)')
    stmt.run(trimmedName)

    return this.findByName(trimmedName)
  },

  /**
   * 根据 ID 查找标签
   */
  findById(id: number): TagRow | null {
    const stmt = db.prepare(`
      SELECT id, name, created_at as createdAt FROM tags WHERE id = ?
    `)
    return (stmt.get(id) as TagRow | undefined) || null
  },

  /**
   * 根据名称查找标签
   */
  findByName(name: string): TagRow | null {
    const stmt = db.prepare(`
      SELECT id, name, created_at as createdAt FROM tags WHERE name = ?
    `)
    return (stmt.get(name.trim()) as TagRow | undefined) || null
  },

  /**
   * 获取所有标签（带使用次数）
   */
  findAll(): TagWithCount[] {
    const stmt = db.prepare(`
      SELECT 
        t.id, t.name, t.created_at as createdAt,
        COUNT(pt.photo_id) as count
      FROM tags t
      LEFT JOIN photo_tags pt ON t.id = pt.tag_id
      GROUP BY t.id
      ORDER BY count DESC, t.name ASC
    `)
    return stmt.all() as TagWithCount[]
  },

  /**
   * 随机获取标签
   */
  findRandom(limit: number = 10): TagWithCount[] {
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
    return stmt.all(limit) as TagWithCount[]
  },

  /**
   * 搜索标签
   */
  search(keyword: string, limit: number = 20): TagWithCount[] {
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
    return stmt.all(`%${keyword}%`, limit) as TagWithCount[]
  },

  /**
   * 批量创建或获取标签
   */
  findOrCreateMany(names: string[]): TagRow[] {
    const tags: TagRow[] = []
    
    const transaction = db.transaction(() => {
      const insertStmt = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)')
      const selectStmt = db.prepare('SELECT id, name, created_at as createdAt FROM tags WHERE name = ?')

      for (const name of names) {
        const trimmedName = name.trim()
        if (!trimmedName) continue
        
        insertStmt.run(trimmedName)
        const tag = selectStmt.get(trimmedName) as TagRow | undefined
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
   */
  findByPhotoId(photoId: number): TagRow[] {
    const stmt = db.prepare(`
      SELECT t.id, t.name, t.created_at as createdAt
      FROM tags t
      JOIN photo_tags pt ON t.id = pt.tag_id
      WHERE pt.photo_id = ?
    `)
    return stmt.all(photoId) as TagRow[]
  },

  /**
   * 为图片添加标签
   */
  addToPhoto(photoId: number, tagId: number): boolean {
    const stmt = db.prepare('INSERT OR IGNORE INTO photo_tags (photo_id, tag_id) VALUES (?, ?)')
    const result = stmt.run(photoId, tagId)
    return result.changes > 0
  },

  /**
   * 从图片移除标签
   */
  removeFromPhoto(photoId: number, tagId: number): boolean {
    const stmt = db.prepare('DELETE FROM photo_tags WHERE photo_id = ? AND tag_id = ?')
    const result = stmt.run(photoId, tagId)
    return result.changes > 0
  },

  /**
   * 删除标签（如果没有被任何图片使用）
   */
  delete(id: number): boolean {
    // 检查是否有图片使用此标签
    const checkStmt = db.prepare('SELECT COUNT(*) as count FROM photo_tags WHERE tag_id = ?')
    const { count } = checkStmt.get(id) as CountRow
    
    if (count > 0) {
      return false
    }

    const stmt = db.prepare('DELETE FROM tags WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  },

  /**
   * 清理未使用的标签
   */
  cleanupUnused(): number {
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
   */
  count(): number {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM tags')
    return (stmt.get() as CountRow).count
  },

  /**
   * 获取有图片关联的标签数量
   */
  countUsed(): number {
    const stmt = db.prepare(`
      SELECT COUNT(DISTINCT tag_id) as count FROM photo_tags
    `)
    return (stmt.get() as CountRow).count
  },

  /**
   * 解析标签字符串
   * 从 "#标签1 #标签2 #标签3" 格式解析出标签数组
   */
  parseTags(input: string): string[] {
    if (!input) return []
    
    const regex = /#([^\s#]+)/g
    const matches = input.matchAll(regex)
    const tags = new Set<string>()

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
