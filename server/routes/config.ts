import express from 'express'
import * as configController from '../controllers/configController.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/', configController.getConfig)
router.put('/', authMiddleware, adminMiddleware, configController.updateConfig)

export default router
