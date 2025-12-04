import express from 'express'
import type { ErrorRequestHandler } from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
import history from 'connect-history-api-fallback'
import dotenv from 'dotenv'

// Import routes
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import photoRoutes from './routes/photos.js'
import tagRoutes from './routes/tags.js'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/photos', photoRoutes)
app.use('/api/tags', tagRoutes)

// Static files - uploaded photos
// Use UPLOAD_PATH from env or default to ../uploads
const uploadPath = process.env.UPLOAD_PATH || path.join(__dirname, '../uploads')
app.use('/uploads', express.static(uploadPath))

// Vue SPA support - must be after API routes
app.use(history())

// Static files - Vue build output
app.use(express.static(path.join(__dirname, '../dist')))

// Error handling middleware
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  })
}
app.use(errorHandler)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`PhotoWall server running on http://localhost:${PORT}`)
})
