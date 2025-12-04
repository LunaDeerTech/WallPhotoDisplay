import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'

/**
 * 生成 JWT Token
 * @param {Object} payload - Token 载荷
 * @param {string} [expiresIn='7d'] - 过期时间
 * @returns {string} JWT Token
 */
export function generateToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn })
}

/**
 * 验证 JWT Token
 * @param {string} token - JWT Token
 * @returns {Object|null} 解码后的载荷或 null
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

/**
 * JWT 认证中间件
 * 验证请求头中的 Authorization: Bearer <token>
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'No token provided'
    })
  }
  
  const token = authHeader.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided'
    })
  }
  
  const decoded = verifyToken(token)
  
  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    })
  }
  
  // 将用户信息附加到请求对象
  req.user = decoded
  next()
}

/**
 * 可选认证中间件
 * 如果有 token 则验证并附加用户信息，没有 token 也允许通过
 */
export function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  
  if (!authHeader) {
    req.user = null
    return next()
  }
  
  const token = authHeader.replace('Bearer ', '')
  
  if (!token) {
    req.user = null
    return next()
  }
  
  const decoded = verifyToken(token)
  req.user = decoded || null
  next()
}

/**
 * 管理员权限中间件
 * 必须在 authMiddleware 之后使用
 */
export function adminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    })
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    })
  }
  
  next()
}

/**
 * 所有者或管理员权限中间件
 * 用于验证用户是资源所有者或管理员
 * @param {Function} getResourceUserId - 从请求中获取资源所有者 ID 的函数
 */
export function ownerOrAdminMiddleware(getResourceUserId) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      })
    }
    
    // 管理员直接通过
    if (req.user.role === 'admin') {
      return next()
    }
    
    // 检查是否为资源所有者
    const resourceUserId = await getResourceUserId(req)
    
    if (resourceUserId === null || resourceUserId === undefined) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      })
    }
    
    if (req.user.id !== resourceUserId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      })
    }
    
    next()
  }
}

export default {
  generateToken,
  verifyToken,
  authMiddleware,
  optionalAuthMiddleware,
  adminMiddleware,
  ownerOrAdminMiddleware
}
