import express from 'express'
const Router = express.Router
import { getAllTags, getRandomTags, searchTags } from '../controllers/tagController.js'

const router = Router()

/**
 * @route GET /api/tags
 * @desc 获取所有标签
 * @access Public
 */
router.get('/', getAllTags)

/**
 * @route GET /api/tags/random
 * @desc 随机获取标签
 * @access Public
 */
router.get('/random', getRandomTags)

/**
 * @route GET /api/tags/search
 * @desc 搜索标签
 * @access Public
 */
router.get('/search', searchTags)

export default router
