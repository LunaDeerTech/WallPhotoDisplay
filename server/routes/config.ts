import express from 'express'
import * as configController from '../controllers/configController.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/', configController.getConfig)
router.put('/', authMiddleware, adminMiddleware, configController.updateConfig)
router.post('/test-email', authMiddleware, adminMiddleware, configController.sendTestEmail)

export default router
