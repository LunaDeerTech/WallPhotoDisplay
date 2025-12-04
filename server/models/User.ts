import db from '../config/database.ts'
import bcrypt from 'bcrypt'
import type { UserPublic, UserWithPassword, UserCreateInput, UserUpdateInput } from '../types/index.ts'

const SALT_ROUNDS = 10

// 数据库返回的用户行类型
interface UserRow {
  id: number
  username: string
  password?: string
  displayName: string
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
  create({ username, password, displayName, role = 'user' }: UserCreateInput): UserPublic | null {
    const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS)
    
    const stmt = db.prepare(`
      INSERT INTO users (username, password, display_name, role)
      VALUES (?, ?, ?, ?)
    `)
    
    const result = stmt.run(username, hashedPassword, displayName || username, role)
    
    return this.findById(result.lastInsertRowid as number)
  },

  /**
   * 根据 ID 查找用户
   */
  findById(id: number): UserPublic | null {
    const stmt = db.prepare(`
      SELECT id, username, display_name as displayName, role, created_at as createdAt, updated_at as updatedAt
      FROM users WHERE id = ?
    `)
    return (stmt.get(id) as UserRow | undefined) || null
  },

  /**
   * 根据用户名查找用户（包含密码，用于登录验证）
   */
  findByUsername(username: string): UserWithPassword | null {
    const stmt = db.prepare(`
      SELECT id, username, password, display_name as displayName, role, created_at as createdAt, updated_at as updatedAt
      FROM users WHERE username = ?
    `)
    return (stmt.get(username) as UserRowWithPassword | undefined) || null
  },

  /**
   * 获取所有用户
   */
  findAll(): UserPublic[] {
    const stmt = db.prepare(`
      SELECT id, username, display_name as displayName, role, created_at as createdAt, updated_at as updatedAt
      FROM users ORDER BY created_at DESC
    `)
    return stmt.all() as UserRow[]
  },

  /**
   * 更新用户信息
   */
  update(id: number, { displayName, role }: UserUpdateInput): UserPublic | null {
    const updates: string[] = []
    const values: (string | number)[] = []

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
