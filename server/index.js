import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
import history from 'connect-history-api-fallback'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// API routes (to be implemented)
// app.use('/api/auth', authRoutes)
// app.use('/api/users', userRoutes)
// app.use('/api/photos', photoRoutes)
// app.use('/api/tags', tagRoutes)

// Static files - uploaded photos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Vue SPA support - must be after API routes
app.use(history())

// Static files - Vue build output
app.use(express.static(path.join(__dirname, '../dist')))

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`PhotoWall server running on http://localhost:${PORT}`)
})
