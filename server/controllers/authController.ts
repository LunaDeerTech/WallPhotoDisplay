import type { Response } from 'express'
import { User, Verification } from '../models/index.js'
import { generateToken } from '../middleware/auth.js'
import { sendEmail } from '../utils/email.js'
import { loadConfig } from './configController.js'
import bcrypt from 'bcrypt'
import type { AuthenticatedRequest, LoginRequestBody, RegisterRequestBody } from '../types/index.js'

/**
 * 用户注册
 * POST /api/auth/register
 */
export async function register(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { username, password, displayName } = req.body as RegisterRequestBody
    
    // 验证参数
    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: 'Username and password are required'
      })
      return
    }
    
    // 验证用户名格式
    if (username.length < 4 || username.length > 20) {
      res.status(400).json({
        success: false,
        error: 'Username must be between 4 and 20 characters'
      })
      return
    }
    
    if (!/^[\w]+$/.test(username)) {
      res.status(400).json({
        success: false,
        error: 'Username can only contain letters, numbers, and underscores'
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
    
    // 检查用户名是否已存在
    if (User.existsByUsername(username)) {
      res.status(409).json({
        success: false,
        error: 'Username already exists'
      })
      return
    }
    
    // 检查系统设置是否允许注册
    const config = await loadConfig()
    if (!config.allowRegistration) {
      res.status(403).json({
        success: false,
        error: 'Registration is not allowed'
      })
      return
    }
    
    // 创建用户（User.create 内部会处理密码哈希）
    const newUser = User.create({
      username,
      password: password,
      displayName: displayName || username,
      role: 'user'
    })
    
    if (!newUser) {
      res.status(500).json({
        success: false,
        error: 'Failed to create user'
      })
      return
    }
    
    // 生成 JWT Token
    const token = generateToken({
      id: newUser.id,
      username: newUser.username,
      role: newUser.role
    })
    
    // 返回用户信息（不含密码）
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          displayName: newUser.displayName,
          email: newUser.email,
          emailVerified: newUser.emailVerified,
          role: newUser.role
        }
      }
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({
      success: false,
      error: 'Register failed'
    })
  }
}

/**
 * 用户登录
 * POST /api/auth/login
 */
export async function login(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { username, password } = req.body as LoginRequestBody
    
    // 验证参数
    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: 'Username and password are required'
      })
      return
    }
    
    // 查找用户（包含密码）
    const user = User.findByUsername(username)
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      })
      return
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password)
    
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      })
      return
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
          email: user.email,
          emailVerified: user.emailVerified,
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
export async function logout(_req: AuthenticatedRequest, res: Response): Promise<void> {
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
export async function getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
      return
    }

    const user = User.findById(req.user.id)
    
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
    console.error('Get current user error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get user info'
    })
  }
}

/**
 * 发送邮箱验证码
 * POST /api/auth/send-verification-code
 */
export async function sendVerificationCode(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { email } = req.body
    const userId = req.user?.id

    if (!email) {
      res.status(400).json({ success: false, error: 'Email is required' })
      return
    }

    // Check if email is already used by another user
    if (User.existsByEmail(email, userId)) {
      res.status(400).json({ success: false, error: 'Email is already in use' })
      return
    }

    // Rate limiting
    const ip = (req.ip || req.socket.remoteAddress || null) as string | null
    if (!Verification.checkRateLimit(email, ip)) {
      res.status(429).json({ success: false, error: 'Too many requests. Please wait.' })
      return
    }

    // Generate code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Save code
    Verification.create(email, code, ip)

    // Send email
    const config = await loadConfig()
    if (!config.smtpHost) {
      res.status(500).json({ success: false, error: 'SMTP configuration missing' })
      return
    }

    await sendEmail({
      host: config.smtpHost,
      port: config.smtpPort,
      user: config.smtpUser,
      pass: config.smtpPass,
      from: config.smtpFrom,
      secure: config.smtpSecure
    }, email, 'Email Verification Code', `Your verification code is: <b>${code}</b>. It expires in 10 minutes.`)

    res.json({ success: true, message: 'Verification code sent' })
  } catch (error) {
    console.error('Send verification code error:', error)
    res.status(500).json({ success: false, error: 'Failed to send verification code' })
  }
}

/**
 * 验证邮箱
 * POST /api/auth/verify-email
 */
export async function verifyEmail(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { email, code } = req.body
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    if (!email || !code) {
      res.status(400).json({ success: false, error: 'Email and code are required' })
      return
    }

    const verification = Verification.findValid(email, code)
    if (!verification) {
      res.status(400).json({ success: false, error: 'Invalid or expired verification code' })
      return
    }

    // Update user
    User.verifyEmail(userId, email)

    // Clean up
    Verification.deleteByEmail(email)

    res.json({ success: true, message: 'Email verified successfully' })
  } catch (error) {
    console.error('Verify email error:', error)
    res.status(500).json({ success: false, error: 'Failed to verify email' })
  }
}

export default {
  register,
  login,
  logout,
  getCurrentUser,
  sendVerificationCode,
  verifyEmail

}
