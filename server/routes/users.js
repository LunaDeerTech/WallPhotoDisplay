import { Router } from 'express'
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updatePassword
} from '../controllers/userController.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = Router()

/**
 * @route GET /api/users
 * @desc 获取所有用户列表
 * @access Admin
 */
router.get('/', authMiddleware, adminMiddleware, getAllUsers)

/**
 * @route GET /api/users/:id
 * @desc 获取单个用户信息
 * @access Admin
 */
router.get('/:id', authMiddleware, adminMiddleware, getUserById)

/**
 * @route POST /api/users
 * @desc 创建新用户
 * @access Admin
 */
router.post('/', authMiddleware, adminMiddleware, createUser)

/**
 * @route PUT /api/users/:id
 * @desc 更新用户信息
 * @access Admin or Self
 */
router.put('/:id', authMiddleware, updateUser)

/**
 * @route DELETE /api/users/:id
 * @desc 删除用户
 * @access Admin
 */
router.delete('/:id', authMiddleware, adminMiddleware, deleteUser)

/**
 * @route PUT /api/users/:id/password
 * @desc 修改用户密码
 * @access Admin or Self
 */
router.put('/:id/password', authMiddleware, updatePassword)

export default router
