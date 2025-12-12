import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Ensure required directories exist before starting the application
 */
export function ensureDirectories() {
  // Ensure data directory exists
  // In production/dist: server/utils -> ../../data
  // In dev: server/utils -> ../../data
  const dataDir = process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : path.join(__dirname, '../../data')
  
  if (!fs.existsSync(dataDir)) {
    console.log(`Creating data directory: ${dataDir}`)
    fs.mkdirSync(dataDir, { recursive: true })
  }

  // Ensure uploads directory exists
  const uploadsDir = process.env.UPLOAD_PATH ? process.env.UPLOAD_PATH : path.join(__dirname, '../../data/uploads')
  
  if (!fs.existsSync(uploadsDir)) {
    console.log(`Creating uploads directory: ${uploadsDir}`)
    fs.mkdirSync(uploadsDir, { recursive: true })
  }
}
