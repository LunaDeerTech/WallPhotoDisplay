import request from '../utils/request.js'

/**
 * Tags API - 标签相关接口
 */
const tagsApi = {
  /**
   * 获取所有标签（带使用次数）
   * @returns {Promise<{success: boolean, data?: Array<{id: number, name: string, count: number}>, error?: string}>}
   */
  getAllTags() {
    return request.get('/tags')
  },

  /**
   * 随机获取标签
   * @param {number} [limit=10] - 返回数量
   * @returns {Promise<{success: boolean, data?: Array<{id: number, name: string, count: number}>, error?: string}>}
   */
  getRandomTags(limit = 10) {
    return request.get('/tags/random', { params: { limit } })
  },

  /**
   * 搜索标签
   * @param {string} keyword - 搜索关键词
   * @param {number} [limit=20] - 返回数量
   * @returns {Promise<{success: boolean, data?: Array<{id: number, name: string, count: number}>, error?: string}>}
   */
  searchTags(keyword, limit = 20) {
    return request.get('/tags/search', { params: { keyword, limit } })
  }
}

export default tagsApi
