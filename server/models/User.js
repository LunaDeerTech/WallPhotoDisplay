import db from '../config/database.js'
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

/**
 * User 模型 - 用户相关数据库操作
 */
const User = {
  /**
   * 创建新用户
   * @param {Object} userData - 用户数据
   * @param {string} userData.username - 用户名（登录账号）
   * @param {string} userData.password - 明文密码
   * @param {string} [userData.displayName] - 显示名称
   * @param {string} [userData.role='user'] - 用户角色
   * @returns {Object} 创建的用户对象（不含密码）
   */
  create({ username, password, displayName, role = 'user' }) {
    const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS)
    
    const stmt = db.prepare(`
      INSERT INTO users (username, password, display_name, role)
      VALUES (?, ?, ?, ?)
    `)
    
    const result = stmt.run(username, hashedPassword, displayName || username, role)
    
    return this.findById(result.lastInsertRowid)
  },

  /**
   * 根据 ID 查找用户
   * @param {number} id - 用户 ID
   * @returns {Object|null} 用户对象（不含密码）
   */
  findById(id) {
    const stmt = db.prepare(`
      SELECT id, username, display_name as displayName, role, created_at as createdAt, updated_at as updatedAt
      FROM users WHERE id = ?
    `)
    return stmt.get(id) || null
  },

  /**
   * 根据用户名查找用户（包含密码，用于登录验证）
   * @param {string} username - 用户名
   * @returns {Object|null} 用户对象（含密码）
   */
  findByUsername(username) {
    const stmt = db.prepare(`
      SELECT id, username, password, display_name as displayName, role, created_at as createdAt, updated_at as updatedAt
      FROM users WHERE username = ?
    `)
    return stmt.get(username) || null
  },

  /**
   * 获取所有用户
   * @returns {Array} 用户列表（不含密码）
   */
  findAll() {
    const stmt = db.prepare(`
      SELECT id, username, display_name as displayName, role, created_at as createdAt, updated_at as updatedAt
      FROM users ORDER BY created_at DESC
    `)
    return stmt.all()
  },

  /**
   * 更新用户信息
   * @param {number} id - 用户 ID
   * @param {Object} updates - 要更新的字段
   * @param {string} [updates.displayName] - 显示名称
   * @param {string} [updates.role] - 用户角色
   * @returns {Object|null} 更新后的用户对象
   */
  update(id, { displayName, role }) {
    const updates = []
    const values = []

    if (displayName !== undefined) {
      updates.push('display_name = ?')
      values.push(displayName)
    }

    if (role !== undefined) {
      updates.push('role = ?')
      values.push(role)
    }

    if (updates.length === 0) {
      return this.findById(id)
    }

    updates.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    const stmt = db.prepare(`
      UPDATE users SET ${updates.join(', ')} WHERE id = ?
    `)
    
    stmt.run(...values)
    return this.findById(id)
  },

  /**
   * 更新用户密码
   * @param {number} id - 用户 ID
   * @param {string} newPassword - 新密码（明文）
   * @returns {boolean} 是否更新成功
   */
  updatePassword(id, newPassword) {
    const hashedPassword = bcrypt.hashSync(newPassword, SALT_ROUNDS)
    
    const stmt = db.prepare(`
      UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `)
    
    const result = stmt.run(hashedPassword, id)
    return result.changes > 0
  },

  /**
   * 删除用户
   * @param {number} id - 用户 ID
   * @returns {boolean} 是否删除成功
   */
  delete(id) {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  },

  /**
   * 验证密码
   * @param {string} plainPassword - 明文密码
   * @param {string} hashedPassword - 加密后的密码
   * @returns {boolean} 密码是否匹配
   */
  verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compareSync(plainPassword, hashedPassword)
  },

  /**
   * 检查用户名是否已存在
   * @param {string} username - 用户名
   * @returns {boolean} 是否存在
   */
  existsByUsername(username) {
    const stmt = db.prepare('SELECT 1 FROM users WHERE username = ?')
    return !!stmt.get(username)
  },

  /**
   * 获取用户数量
   * @returns {number} 用户总数
   */
  count() {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM users')
    return stmt.get().count
  }
}

export default User
