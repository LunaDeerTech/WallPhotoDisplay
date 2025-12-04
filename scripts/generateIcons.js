/**
 * PWA 图标生成脚本
 * 使用 sharp 将 SVG 图标转换为各种尺寸的 PNG 图标
 * 
 * 运行方式: node scripts/generateIcons.js
 */

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 图标尺寸列表
const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

// Apple Touch Icon 尺寸
const appleTouchIconSize = 180

// SVG 源文件路径
const svgPath = path.join(__dirname, '../public/favicon.svg')

// 输出目录
const outputDir = path.join(__dirname, '../public/icons')

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

async function generateIcons() {
  try {
    // 读取 SVG 文件
    const svgBuffer = fs.readFileSync(svgPath)

    console.log('🎨 开始生成 PWA 图标...\n')

    // 生成各种尺寸的图标
    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`)
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath)
      console.log(`✅ 已生成: icon-${size}x${size}.png`)
    }

    // 生成 Apple Touch Icon
    const appleTouchIconPath = path.join(outputDir, 'apple-touch-icon.png')
    await sharp(svgBuffer)
      .resize(appleTouchIconSize, appleTouchIconSize)
      .png()
      .toFile(appleTouchIconPath)
    console.log(`✅ 已生成: apple-touch-icon.png (${appleTouchIconSize}x${appleTouchIconSize})`)

    // 生成 favicon.ico (使用 32x32 PNG 作为 ICO 的替代)
    const faviconPath = path.join(__dirname, '../public/favicon.ico')
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(faviconPath)
    console.log('✅ 已生成: favicon.ico (32x32 PNG)')

    console.log('\n🎉 所有图标生成完成!')
    console.log(`📁 输出目录: ${outputDir}`)

  } catch (error) {
    console.error('❌ 生成图标时出错:', error)
    process.exit(1)
  }
}

generateIcons()
