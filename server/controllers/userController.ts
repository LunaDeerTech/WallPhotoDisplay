import { Response } from 'express'
import { User } from '../models/index.js'
import bcrypt from 'bcrypt'
import type { AuthenticatedRequest, UserCreateInput, UserUpdateInput } from '../types/index.js'

// 请求体类型定义
interface PasswordUpdateBody {
  oldPassword?: string
  newPassword: string
}

/**
 * 获取所有用户列表
 * GET /api/users
 */
export async function getAllUsers(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const users = User.findAll()
    
    res.json({
      success: true,
      data: users
    })
  } catch (error) {
    console.error('Get all users error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get users'
    })
  }
}

/**
 * 获取单个用户
 * GET /api/users/:id
 */
export async function getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const user = User.findById(parseInt(id))
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      })
      return
    }
    
    res.json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Get user by id error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get user'
    })
  }
}

/**
 * 创建新用户
 * POST /api/users
 */
export async function createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { username, password, displayName, role = 'user' } = req.body as UserCreateInput
    
    // 验证参数
    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: 'Username and password are required'
      })
      return
    }
    
    // 验证用户名格式
    if (!/^[a-zA-Z0-9_]{3,50}$/.test(username)) {
      res.status(400).json({
        success: false,
        error: 'Username must be 3-50 characters, only letters, numbers, and underscores allowed'
      })
      return
    }
    
    // 验证密码长度
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      })
      return
    }
    
    // 验证角色
    if (role && !['admin', 'user'].includes(role)) {
      res.status(400).json({
        success: false,
        error: 'Invalid role. Must be "admin" or "user"'
      })
      return
    }
    
    // 检查用户名是否已存在
    const existingUser = User.findByUsername(username)
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'Username already exists'
      })
      return
    }
    
    // 创建用户
    const user = User.create({
      username,
      password,
      displayName: displayName || username,
      role
    })
    
    res.status(201).json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create user'
    })
  }
}

/**
 * 更新用户信息
 * PUT /api/users/:id
 */
export async function updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
      return
    }

    const { id } = req.params
    const { displayName, role } = req.body as UserUpdateInput
    const userId = parseInt(id)
    
    // 检查用户是否存在
    const existingUser = User.findById(userId)
    if (!existingUser) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      })
      return
    }
    
    // 非管理员只能修改自己的信息
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      })
      return
    }
    
    // 非管理员不能修改角色
    const updates: UserUpdateInput = { displayName }
    if (req.user.role === 'admin' && role) {
      // 不能修改自己的角色
      if (req.user.id === userId) {
        res.status(400).json({
          success: false,
          error: 'Cannot change your own role'
        })
        return
      }
      updates.role = role
    }
    
    const user = User.update(userId, updates)
    
    res.json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    })
  }
}

/**
 * 删除用户
 * DELETE /api/users/:id
 */
export async function deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
      return
    }

    const { id } = req.params
    const userId = parseInt(id)
    
    // 不能删除自己
    if (req.user.id === userId) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      })
      return
    }
    
    // 检查用户是否存在
    const existingUser = User.findById(userId)
    if (!existingUser) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      })
      return
    }
    
    User.delete(userId)
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    })
  }
}

/**
 * 修改用户密码
 * PUT /api/users/:id/password
 */
export async function updatePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
      return
    }

    const { id } = req.params
    const { oldPassword, newPassword } = req.body as PasswordUpdateBody
    const userId = parseInt(id)
    
    // 验证参数
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters'
      })
      return
    }
    
    // 检查用户是否存在
    const userPublic = User.findById(userId)
    if (!userPublic) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      })
      return
    }

    const existingUser = User.findByUsername(userPublic.username)
    if (!existingUser) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      })
      return
    }
    
    // 非管理员修改自己的密码需要验证旧密码
    if (req.user.role !== 'admin' || req.user.id === userId) {
      if (!oldPassword) {
        res.status(400).json({
          success: false,
          error: 'Current password is required'
        })
        return
      }
      
      const isOldPasswordValid = await bcrypt.compare(oldPassword, existingUser.password)
      if (!isOldPasswordValid) {
        res.status(401).json({
          success: false,
          error: 'Current password is incorrect'
        })
        return
      }
    }
    
    // 更新密码
    User.updatePassword(userId, newPassword)
    
    res.json({
      success: true,
      message: 'Password updated successfully'
    })
  } catch (error) {
    console.error('Update password error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update password'
    })
  }
}

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updatePassword
}
