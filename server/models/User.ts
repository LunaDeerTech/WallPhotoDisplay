import db from '../config/database.js'
import bcrypt from 'bcrypt'
import type { UserPublic, UserWithPassword, UserCreateInput, UserUpdateInput } from '../types/index.js'

const SALT_ROUNDS = 10

// 数据库返回的用户行类型
interface UserRow {
  id: number
  username: string
  password?: string
  displayName: string
  email?: string
  emailVerified: number // SQLite returns 0/1
  role: 'admin' | 'user'
  createdAt: string
  updatedAt: string
}

interface UserRowWithPassword extends UserRow {
  password: string
}

interface CountRow {
  count: number
}

/**
 * User 模型 - 用户相关数据库操作
 */
const User = {
  /**
   * 创建新用户
   */
  create({ username, password, displayName, email, role = 'user' }: UserCreateInput): UserPublic | null {
    const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS)
    
    const stmt = db.prepare(`
      INSERT INTO users (username, password, display_name, email, role)
      VALUES (?, ?, ?, ?, ?)
    `)
    
    const result = stmt.run(username, hashedPassword, displayName || username, email || null, role)
    
    return this.findById(result.lastInsertRowid as number)
  },

  /**
   * 根据 ID 查找用户
   */
  findById(id: number): UserPublic | null {
    const stmt = db.prepare(`
      SELECT id, username, display_name as displayName, email, email_verified as emailVerified, role, created_at as createdAt, updated_at as updatedAt
      FROM users WHERE id = ?
    `)
    const row = stmt.get(id) as UserRow | undefined
    if (!row) return null
    return {
      ...row,
      emailVerified: Boolean(row.emailVerified)
    }
  },

  /**
   * 根据用户名查找用户（包含密码，用于登录验证）
   */
  findByUsername(username: string): UserWithPassword | null {
    const stmt = db.prepare(`
      SELECT id, username, password, display_name as displayName, email, email_verified as emailVerified, role, created_at as createdAt, updated_at as updatedAt
      FROM users WHERE username = ?
    `)
    const row = stmt.get(username) as UserRowWithPassword | undefined
    if (!row) return null
    return {
      ...row,
      emailVerified: Boolean(row.emailVerified)
    }
  },

  /**
   * 根据邮箱查找用户
   */
  findByEmail(email: string): UserPublic[] {
    const stmt = db.prepare(`
      SELECT id, username, display_name as displayName, email, email_verified as emailVerified, role, created_at as createdAt, updated_at as updatedAt
      FROM users WHERE email = ?
    `)
    const rows = stmt.all(email) as UserRow[]
    return rows.map(row => ({
      ...row,
      emailVerified: Boolean(row.emailVerified)
    }))
  },

  /**
   * 获取所有用户
   */
  findAll(): UserPublic[] {
    const stmt = db.prepare(`
      SELECT id, username, display_name as displayName, email, email_verified as emailVerified, role, created_at as createdAt, updated_at as updatedAt
      FROM users ORDER BY created_at DESC
    `)
    const rows = stmt.all() as UserRow[]
    return rows.map(row => ({
      ...row,
      emailVerified: Boolean(row.emailVerified)
    }))
  },

  /**
   * 更新用户信息
   */
  update(id: number, { displayName, email, role }: UserUpdateInput): UserPublic | null {
    const updates: string[] = []
    const values: (string | number)[] = []

    if (displayName !== undefined) {
      updates.push('display_name = ?')
      values.push(displayName)
    }

    if (email !== undefined) {
      updates.push('email = ?')
      values.push(email)
      // Reset verification if email changes
      updates.push('email_verified = 0')
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
   * 验证邮箱
   */
  verifyEmail(id: number, email: string): boolean {
    const stmt = db.prepare(`
      UPDATE users 
      SET email = ?, email_verified = 1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `)
    const result = stmt.run(email, id)
    return result.changes > 0
  },

  /**
   * 检查邮箱是否已被使用
   */
  existsByEmail(email: string, excludeUserId?: number): boolean {
    let sql = 'SELECT 1 FROM users WHERE email = ?'
    const params: (string | number)[] = [email]
    
    if (excludeUserId) {
      sql += ' AND id != ?'
      params.push(excludeUserId)
    }
    
    const stmt = db.prepare(sql)
    return !!stmt.get(...params)
  },


  /**
   * 更新用户密码
   */
  updatePassword(id: number, newPassword: string): boolean {
    const hashedPassword = bcrypt.hashSync(newPassword, SALT_ROUNDS)
    
    const stmt = db.prepare(`
      UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `)
    
    const result = stmt.run(hashedPassword, id)
    return result.changes > 0
  },

  /**
   * 删除用户
   */
  delete(id: number): boolean {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  },

  /**
   * 验证密码
   */
  verifyPassword(plainPassword: string, hashedPassword: string): boolean {
    return bcrypt.compareSync(plainPassword, hashedPassword)
  },

  /**
   * 检查用户名是否已存在
   */
  existsByUsername(username: string): boolean {
    const stmt = db.prepare('SELECT 1 FROM users WHERE username = ?')
    return !!stmt.get(username)
  },

  /**
   * 获取用户数量
   */
  count(): number {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM users')
    return (stmt.get() as CountRow).count
  }
}

export default User
