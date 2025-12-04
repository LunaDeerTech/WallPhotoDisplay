import express from 'express'
const Router = express.Router
import {
  getPhotos,
  getMyPhotos,
  getPhotoById,
  uploadPhotos,
  updatePhotoTags,
  deletePhoto,
  batchDeletePhotos,
  batchUpdateTags
} from '../controllers/photoController.js'
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js'
import { uploadMultiple, handleUploadError } from '../middleware/upload.js'

const router = Router()

/**
 * @route GET /api/photos
 * @desc 获取图片列表（支持分页、筛选、排序）
 * @access Public
 */
router.get('/', optionalAuthMiddleware, getPhotos)

/**
 * @route GET /api/photos/my
 * @desc 获取当前用户的图片
 * @access Protected
 */
router.get('/my', authMiddleware, getMyPhotos)

/**
 * @route GET /api/photos/:id
 * @desc 获取单张图片详情
 * @access Public
 */
router.get('/:id', optionalAuthMiddleware, getPhotoById)

/**
 * @route POST /api/photos
 * @desc 上传图片
 * @access Protected
 */
router.post('/', authMiddleware, uploadMultiple, handleUploadError, uploadPhotos)

/**
 * @route PUT /api/photos/batch/tags
 * @desc 批量更新图片标签
 * @access Protected (Owner or Admin)
 */
router.put('/batch/tags', authMiddleware, batchUpdateTags)

/**
 * @route DELETE /api/photos/batch
 * @desc 批量删除图片
 * @access Protected (Owner or Admin)
 */
router.delete('/batch', authMiddleware, batchDeletePhotos)

/**
 * @route PUT /api/photos/:id/tags
 * @desc 更新图片标签
 * @access Protected (Owner or Admin)
 */
router.put('/:id/tags', authMiddleware, updatePhotoTags)

/**
 * @route DELETE /api/photos/:id
 * @desc 删除图片
 * @access Protected (Owner or Admin)
 */
router.delete('/:id', authMiddleware, deletePhoto)

export default router
