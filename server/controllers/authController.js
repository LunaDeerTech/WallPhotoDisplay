import { User } from '../models/index.js'
import { generateToken } from '../middleware/auth.js'
import bcrypt from 'bcrypt'

/**
 * 用户登录
 * POST /api/auth/login
 */
export async function login(req, res) {
  try {
    const { username, password } = req.body
    
    // 验证参数
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      })
    }
    
    // 查找用户（包含密码）
    const user = User.findByUsername(username)
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      })
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password)
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      })
    }
    
    // 生成 JWT Token
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role
    })
    
    // 返回用户信息（不含密码）
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          role: user.role
        }
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      error: 'Login failed'
    })
  }
}

/**
 * 用户登出
 * POST /api/auth/logout
 */
export async function logout(req, res) {
  // JWT 是无状态的，客户端只需要删除 token
  // 这里只返回成功响应
  res.json({
    success: true,
    message: 'Logged out successfully'
  })
}

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
export async function getCurrentUser(req, res) {
  try {
    const user = User.findById(req.user.id)
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }
    
    res.json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Get current user error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get user info'
    })
  }
}

export default {
  login,
  logout,
  getCurrentUser
}
