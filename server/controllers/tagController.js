import { Tag } from '../models/index.js'

/**
 * 获取所有标签
 * GET /api/tags
 */
export async function getAllTags(req, res) {
  try {
    const tags = Tag.findAll()
    
    res.json({
      success: true,
      data: tags
    })
  } catch (error) {
    console.error('Get all tags error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get tags'
    })
  }
}

/**
 * 随机获取标签
 * GET /api/tags/random
 */
export async function getRandomTags(req, res) {
  try {
    const { limit = 10 } = req.query
    
    const tags = Tag.findRandom(parseInt(limit))
    
    res.json({
      success: true,
      data: tags
    })
  } catch (error) {
    console.error('Get random tags error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get random tags'
    })
  }
}

/**
 * 搜索标签
 * GET /api/tags/search
 */
export async function searchTags(req, res) {
  try {
    const { keyword = '', limit = 20 } = req.query
    
    if (!keyword.trim()) {
      return res.json({
        success: true,
        data: []
      })
    }
    
    const tags = Tag.search(keyword.trim(), parseInt(limit))
    
    res.json({
      success: true,
      data: tags
    })
  } catch (error) {
    console.error('Search tags error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to search tags'
    })
  }
}

export default {
  getAllTags,
  getRandomTags,
  searchTags
}
