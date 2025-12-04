import type { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'
import dotenv from 'dotenv'
import type { AuthenticatedRequest, JwtPayload } from '../types/index.js'

dotenv.config()

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'

/**
 * 生成 JWT Token
 */
export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresIn: string = '7d'): string {
  const options: SignOptions = { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
  return jwt.sign(payload, JWT_SECRET, options)
}

/**
 * 验证 JWT Token
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

/**
 * JWT 认证中间件
 * 验证请求头中的 Authorization: Bearer <token>
 */
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  
  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: 'No token provided'
    })
    return
  }
  
  const token = authHeader.replace('Bearer ', '')
  
  if (!token) {
    res.status(401).json({
      success: false,
      error: 'No token provided'
    })
    return
  }
  
  const decoded = verifyToken(token)
  
  if (!decoded) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    })
    return
  }
  
  // 将用户信息附加到请求对象
  req.user = decoded
  next()
}

/**
 * 可选认证中间件
 * 如果有 token 则验证并附加用户信息，没有 token 也允许通过
 */
export function optionalAuthMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  
  if (!authHeader) {
    req.user = undefined
    next()
    return
  }
  
  const token = authHeader.replace('Bearer ', '')
  
  if (!token) {
    req.user = undefined
    next()
    return
  }
  
  const decoded = verifyToken(token)
  req.user = decoded || undefined
  next()
}

/**
 * 管理员权限中间件
 * 必须在 authMiddleware 之后使用
 */
export function adminMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    })
    return
  }
  
  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Admin access required'
    })
    return
  }
  
  next()
}

/**
 * 资源所有者 ID 获取函数类型
 */
type GetResourceUserId = (req: AuthenticatedRequest) => Promise<number | null | undefined> | number | null | undefined

/**
 * 所有者或管理员权限中间件
 * 用于验证用户是资源所有者或管理员
 */
export function ownerOrAdminMiddleware(getResourceUserId: GetResourceUserId) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      })
      return
    }
    
    // 管理员直接通过
    if (req.user.role === 'admin') {
      next()
      return
    }
    
    // 检查是否为资源所有者
    const resourceUserId = await getResourceUserId(req)
    
    if (resourceUserId === null || resourceUserId === undefined) {
      res.status(404).json({
        success: false,
        error: 'Resource not found'
      })
      return
    }
    
    if (req.user.id !== resourceUserId) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      })
      return
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
