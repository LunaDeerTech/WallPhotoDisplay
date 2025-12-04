import request from '../utils/request.js'

/**
 * Photos API - 图片相关接口
 */
const photosApi = {
  /**
   * 获取图片列表（支持分页、筛选、排序）
   * @param {Object} params - 查询参数
   * @param {number} [params.page=1] - 页码
   * @param {number} [params.limit=20] - 每页数量
   * @param {string} [params.tags] - 标签筛选，逗号分隔
   * @param {string} [params.sort='created_at_desc'] - 排序方式 (created_at_desc | created_at_asc | random)
   * @param {number} [params.userId] - 用户筛选
   * @returns {Promise<{success: boolean, data?: {photos: Array, pagination: Object}, error?: string}>}
   */
  getPhotos(params = {}) {
    return request.get('/photos', { params })
  },

  /**
   * 获取当前用户的图片
   * @param {Object} params - 查询参数
   * @param {number} [params.page=1] - 页码
   * @param {number} [params.limit=20] - 每页数量
   * @param {string} [params.tags] - 标签筛选，逗号分隔
   * @param {string} [params.sort='created_at_desc'] - 排序方式
   * @returns {Promise<{success: boolean, data?: {photos: Array, pagination: Object}, error?: string}>}
   */
  getMyPhotos(params = {}) {
    return request.get('/photos/my', { params })
  },

  /**
   * 获取单张图片详情
   * @param {number} id - 图片 ID
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  getPhotoById(id) {
    return request.get(`/photos/${id}`)
  },

  /**
   * 上传图片
   * @param {File[]} files - 图片文件数组
   * @param {string} [tags] - 标签字符串，格式: "#标签1 #标签2"
   * @param {Function} [onUploadProgress] - 上传进度回调
   * @returns {Promise<{success: boolean, data?: {photos: Array, errors?: Array}, error?: string}>}
   */
  uploadPhotos(files, tags = '', onUploadProgress = null) {
    const formData = new FormData()
    
    // 添加文件
    files.forEach(file => {
      formData.append('photos', file)
    })
    
    // 添加标签
    if (tags) {
      formData.append('tags', tags)
    }
    
    return request.post('/photos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onUploadProgress ? (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onUploadProgress(percentCompleted, progressEvent)
      } : undefined
    })
  },

  /**
   * 更新图片标签
   * @param {number} id - 图片 ID
   * @param {string[]} tags - 新的标签数组
   * @returns {Promise<{success: boolean, data?: {id: number, tags: string[]}, error?: string}>}
   */
  updatePhotoTags(id, tags) {
    return request.put(`/photos/${id}/tags`, { tags })
  },

  /**
   * 删除图片
   * @param {number} id - 图片 ID
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  deletePhoto(id) {
    return request.delete(`/photos/${id}`)
  },

  /**
   * 批量删除图片
   * @param {number[]} ids - 图片 ID 数组
   * @returns {Promise<{success: boolean, data?: {deletedIds: number[], errors?: Array}, error?: string}>}
   */
  batchDeletePhotos(ids) {
    return request.delete('/photos/batch', { data: { ids } })
  },

  /**
   * 批量更新图片标签
   * @param {number[]} ids - 图片 ID 数组
   * @param {string[]} tags - 新的标签数组
   * @returns {Promise<{success: boolean, data?: {updatedIds: number[], tags: string[], errors?: Array}, error?: string}>}
   */
  batchUpdateTags(ids, tags) {
    return request.put('/photos/batch/tags', { ids, tags })
  }
}

export default photosApi
