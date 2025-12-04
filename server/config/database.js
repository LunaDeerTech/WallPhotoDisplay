import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 数据库文件路径，默认为项目根目录下的 data/photowall.db
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/photowall.db')

// 创建数据库连接
const db = new Database(DB_PATH)

// 启用外键约束
db.pragma('foreign_keys = ON')

// 启用 WAL 模式以提高并发性能
db.pragma('journal_mode = WAL')

/**
 * 初始化数据库表结构
 */
export function initTables() {
  // 创建 users 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      display_name VARCHAR(100),
      role VARCHAR(20) DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 创建 photos 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      filename VARCHAR(255) NOT NULL,
      original_name VARCHAR(255),
      file_path VARCHAR(500) NOT NULL,
      file_size INTEGER,
      mime_type VARCHAR(100),
      width INTEGER,
      height INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // 创建 tags 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 创建 photo_tags 关联表
  db.exec(`
    CREATE TABLE IF NOT EXISTS photo_tags (
      photo_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (photo_id, tag_id),
      FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `)

  // 创建索引以提高查询性能
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
    CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);
    CREATE INDEX IF NOT EXISTS idx_photo_tags_photo_id ON photo_tags(photo_id);
    CREATE INDEX IF NOT EXISTS idx_photo_tags_tag_id ON photo_tags(tag_id);
    CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
  `)
}

/**
 * 关闭数据库连接
 */
export function closeDatabase() {
  db.close()
}

export default db
