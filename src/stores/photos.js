import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import photosApi from '../api/photos.js'

/**
 * Photos Store - 图片数据状态管理
 */
export const usePhotosStore = defineStore('photos', () => {
  // State
  const photos = ref([])
  const loading = ref(false)
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const currentFilters = ref({
    tags: [],
    sort: 'created_at_desc',
    userId: null
  })

  // Getters
  const hasMore = computed(() => pagination.value.page < pagination.value.totalPages)
  const isEmpty = computed(() => photos.value.length === 0 && !loading.value)
  const totalPhotos = computed(() => pagination.value.total)

  // Actions

  /**
   * 获取图片列表（重新加载）
   * @param {Object} filters - 筛选条件
   * @param {string[]} [filters.tags] - 标签筛选
   * @param {string} [filters.sort] - 排序方式
   * @param {number} [filters.userId] - 用户筛选
   */
  async function fetchPhotos(filters = {}) {
    loading.value = true
    
    // 更新筛选条件
    currentFilters.value = {
      tags: filters.tags || [],
      sort: filters.sort || 'created_at_desc',
      userId: filters.userId || null
    }
    
    try {
      const params = {
        page: 1,
        limit: pagination.value.limit,
        sort: currentFilters.value.sort
      }
      
      // 添加标签筛选
      if (currentFilters.value.tags.length > 0) {
        params.tags = currentFilters.value.tags.join(',')
      }
      
      // 添加用户筛选
      if (currentFilters.value.userId) {
        params.userId = currentFilters.value.userId
      }
      
      const response = await photosApi.getPhotos(params)
      
      if (response.success) {
        photos.value = response.data.photos
        pagination.value = response.data.pagination
        return { success: true }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('Fetch photos error:', error)
      return { success: false, error: error.error || 'Failed to fetch photos' }
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载更多图片（分页）
   */
  async function loadMore() {
    if (!hasMore.value || loading.value) return { success: true }
    
    loading.value = true
    
    try {
      const params = {
        page: pagination.value.page + 1,
        limit: pagination.value.limit,
        sort: currentFilters.value.sort
      }
      
      if (currentFilters.value.tags.length > 0) {
        params.tags = currentFilters.value.tags.join(',')
      }
      
      if (currentFilters.value.userId) {
        params.userId = currentFilters.value.userId
      }
      
      const response = await photosApi.getPhotos(params)
      
      if (response.success) {
        photos.value = [...photos.value, ...response.data.photos]
        pagination.value = response.data.pagination
        return { success: true }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('Load more photos error:', error)
      return { success: false, error: error.error || 'Failed to load more photos' }
    } finally {
      loading.value = false
    }
  }

  /**
   * 上传图片
   * @param {File[]} files - 图片文件数组
   * @param {string[]} [tags] - 标签数组
   * @param {Function} [onProgress] - 进度回调
   */
  async function uploadPhotos(files, tags = [], onProgress = null) {
    try {
      // 将标签数组转换为 "#标签1 #标签2" 格式
      const tagsStr = tags.length > 0 ? tags.map(t => `#${t}`).join(' ') : ''
      
      const response = await photosApi.uploadPhotos(files, tagsStr, onProgress)
      
      if (response.success) {
        // 刷新图片列表
        await fetchPhotos(currentFilters.value)
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('Upload photos error:', error)
      return { success: false, error: error.error || 'Failed to upload photos' }
    }
  }

  /**
   * 更新图片标签
   * @param {number} photoId - 图片 ID
   * @param {string[]} tags - 新的标签数组
   */
  async function updatePhotoTags(photoId, tags) {
    try {
      const response = await photosApi.updatePhotoTags(photoId, tags)
      
      if (response.success) {
        // 更新本地状态
        const index = photos.value.findIndex(p => p.id === photoId)
        if (index !== -1) {
          photos.value[index].tags = tags
        }
        return { success: true }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('Update photo tags error:', error)
      return { success: false, error: error.error || 'Failed to update tags' }
    }
  }

  /**
   * 删除图片
   * @param {number} photoId - 图片 ID
   */
  async function deletePhoto(photoId) {
    try {
      const response = await photosApi.deletePhoto(photoId)
      
      if (response.success) {
        // 从本地状态移除
        photos.value = photos.value.filter(p => p.id !== photoId)
        pagination.value.total -= 1
        return { success: true }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('Delete photo error:', error)
      return { success: false, error: error.error || 'Failed to delete photo' }
    }
  }

  /**
   * 批量更新标签
   * @param {number[]} photoIds - 图片 ID 数组
   * @param {string[]} tags - 新的标签数组
   */
  async function batchUpdateTags(photoIds, tags) {
    try {
      const response = await photosApi.batchUpdateTags(photoIds, tags)
      
      if (response.success) {
        // 更新本地状态
        const updatedIds = response.data.updatedIds
        photos.value.forEach(photo => {
          if (updatedIds.includes(photo.id)) {
            photo.tags = tags
          }
        })
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('Batch update tags error:', error)
      return { success: false, error: error.error || 'Failed to batch update tags' }
    }
  }

  /**
   * 批量删除图片
   * @param {number[]} photoIds - 图片 ID 数组
   */
  async function batchDelete(photoIds) {
    try {
      const response = await photosApi.batchDeletePhotos(photoIds)
      
      if (response.success) {
        // 从本地状态移除
        const deletedIds = response.data.deletedIds
        photos.value = photos.value.filter(p => !deletedIds.includes(p.id))
        pagination.value.total -= deletedIds.length
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('Batch delete photos error:', error)
      return { success: false, error: error.error || 'Failed to batch delete photos' }
    }
  }

  /**
   * 重置状态
   */
  function reset() {
    photos.value = []
    pagination.value = {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    }
    currentFilters.value = {
      tags: [],
      sort: 'created_at_desc',
      userId: null
    }
  }

  /**
   * 设置每页数量
   * @param {number} limit - 每页数量
   */
  function setPageLimit(limit) {
    pagination.value.limit = limit
  }

  return {
    // State
    photos,
    loading,
    pagination,
    currentFilters,
    
    // Getters
    hasMore,
    isEmpty,
    totalPhotos,
    
    // Actions
    fetchPhotos,
    loadMore,
    uploadPhotos,
    updatePhotoTags,
    deletePhoto,
    batchUpdateTags,
    batchDelete,
    reset,
    setPageLimit
  }
})
