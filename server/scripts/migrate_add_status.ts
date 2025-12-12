
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import Database from 'better-sqlite3'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/database.db')
console.log('Database path:', dbPath)

const db = new Database(dbPath)

try {
  console.log('Checking for status column in photos table...')
  const tableInfo = db.pragma('table_info(photos)') as any[]
  const hasStatus = tableInfo.some(col => col.name === 'status')

  if (!hasStatus) {
    console.log('Adding status column to photos table...')
    db.prepare("ALTER TABLE photos ADD COLUMN status TEXT DEFAULT 'approved'").run()
    console.log('✓ Status column added successfully')
  } else {
    console.log('✓ Status column already exists')
  }
} catch (error) {
  console.error('Migration failed:', error)
} finally {
  db.close()
}
