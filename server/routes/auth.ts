import express from 'express'
const Router = express.Router
import { login, logout, getCurrentUser, sendVerificationCode, verifyEmail } from '../controllers/authController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

/**
 * @route POST /api/auth/login
 * @desc 用户登录
 * @access Public
 */
router.post('/login', login)

/**
 * @route POST /api/auth/logout
 * @desc 用户登出
 * @access Protected
 */
router.post('/logout', authMiddleware, logout)

/**
 * @route GET /api/auth/me
 * @desc 获取当前用户信息
 * @access Protected
 */
router.get('/me', authMiddleware, getCurrentUser)

/**
 * @route POST /api/auth/send-verification-code
 * @desc 发送邮箱验证码
 * @access Protected
 */
router.post('/send-verification-code', authMiddleware, sendVerificationCode)

/**
 * @route POST /api/auth/verify-email
 * @desc 验证邮箱
 * @access Protected
 */
router.post('/verify-email', authMiddleware, verifyEmail)

export default router
