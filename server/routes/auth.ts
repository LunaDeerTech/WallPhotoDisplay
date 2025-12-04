import express from 'express'
const Router = express.Router
import { login, logout, getCurrentUser } from '../controllers/authController.ts'
import { authMiddleware } from '../middleware/auth.ts'

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

export default router
