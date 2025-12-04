import request from '@/utils/request'
import type { ApiResponse, Tag } from '@/types'

/**
 * 带使用次数的标签
 */
export interface TagWithCount extends Tag {
  count: number
}

/**
 * Tags API - 标签相关接口
 */
const tagsApi = {
  /**
   * 获取所有标签（带使用次数）
   */
  getAllTags(): Promise<ApiResponse<TagWithCount[]>> {
    return request.get('/tags')
  },

  /**
   * 随机获取标签
   * @param limit - 返回数量
   */
  getRandomTags(limit: number = 10): Promise<ApiResponse<TagWithCount[]>> {
    return request.get('/tags/random', { params: { limit } })
  },

  /**
   * 搜索标签
   * @param keyword - 搜索关键词
   * @param limit - 返回数量
   */
  searchTags(keyword: string, limit: number = 20): Promise<ApiResponse<TagWithCount[]>> {
    return request.get('/tags/search', { params: { keyword, limit } })
  }
}

export default tagsApi
