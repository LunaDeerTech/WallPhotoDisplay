import type { Response } from 'express'
import { Tag } from '../models/index.ts'
import type { AuthenticatedRequest } from '../types/index.ts'

/**
 * 获取所有标签
 * GET /api/tags
 */
export async function getAllTags(_req: AuthenticatedRequest, res: Response): Promise<void> {
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
export async function getRandomTags(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { limit = '10' } = req.query as { limit?: string }
    
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
export async function searchTags(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { keyword = '', limit = '20' } = req.query as { keyword?: string; limit?: string }
    
    if (!keyword.trim()) {
      res.json({
        success: true,
        data: []
      })
      return
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
