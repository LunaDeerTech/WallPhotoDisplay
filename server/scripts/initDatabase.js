/**
 * 数据库初始化脚本
 * 运行: npm run init-db
 * 
 * 功能:
 * 1. 创建数据库表结构
 * 2. 创建默认管理员账号
 */

import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 确保 data 目录存在
const dataDir = path.join(__dirname, '../../data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
  console.log('✓ 创建 data 目录')
}

// 确保 uploads/photos 目录存在
const uploadsDir = path.join(__dirname, '../../uploads/photos')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
  console.log('✓ 创建 uploads/photos 目录')
}

// 导入数据库配置（这会创建数据库文件）
import { initTables } from '../config/database.js'
import User from '../models/User.js'

console.log('\n开始初始化数据库...\n')

// 初始化表结构
try {
  initTables()
  console.log('✓ 数据库表结构创建成功')
} catch (error) {
  console.error('✗ 创建表结构失败:', error.message)
  process.exit(1)
}

// 创建默认管理员账号
const defaultAdmin = {
  username: 'admin',
  password: 'admin123',
  displayName: '管理员',
  role: 'admin'
}

try {
  // 检查管理员是否已存在
  if (User.existsByUsername(defaultAdmin.username)) {
    console.log('✓ 默认管理员账号已存在，跳过创建')
  } else {
    const admin = User.create(defaultAdmin)
    console.log('✓ 默认管理员账号创建成功')
    console.log(`  用户名: ${admin.username}`)
    console.log(`  密码: ${defaultAdmin.password}`)
    console.log('\n  ⚠️  请在首次登录后立即修改密码！')
  }
} catch (error) {
  console.error('✗ 创建管理员账号失败:', error.message)
  process.exit(1)
}

console.log('\n数据库初始化完成！\n')

// 输出统计信息
console.log('数据库统计:')
console.log(`  用户数量: ${User.count()}`)

// 关闭数据库连接
import { closeDatabase } from '../config/database.js'
closeDatabase()

process.exit(0)
