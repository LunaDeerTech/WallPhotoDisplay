import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import photosApi, { type UploadProgressCallback } from '@/api/photos'
import type { Photo } from '@/types'

/**
 * 分页信息
 */
export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

/**
 * 筛选条件
 */
export interface PhotoFilters {
  tags: string[]
  sort: 'created_at_desc' | 'created_at_asc' | 'random'
  userId: number | null
  userIds: number[]
}

/**
 * 操作结果
 */
export interface ActionResult<T = void> {
  success: boolean
  error?: string
  data?: T
}

/**
 * Photos Store - 图片数据状态管理
 */
export const usePhotosStore = defineStore('photos', () => {
  // State
  const photos = ref<Photo[]>([])
  const loading = ref(false)
  const pagination = ref<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const currentFilters = ref<PhotoFilters>({
    tags: [],
    sort: 'created_at_desc',
    userId: null,
    userIds: []
  })

  // Getters
  const hasMore = computed(() => pagination.value.page < pagination.value.totalPages)
  const isEmpty = computed(() => photos.value.length === 0 && !loading.value)
  const totalPhotos = computed(() => pagination.value.total)

  // Actions

  /**
   * 获取图片列表（重新加载）
   */
  async function fetchPhotos(filters: Partial<PhotoFilters> = {}): Promise<ActionResult> {
    loading.value = true
    
    // 更新筛选条件
    currentFilters.value = {
      tags: filters.tags ?? [],
      sort: filters.sort ?? 'created_at_desc',
      userId: filters.userId ?? null,
      userIds: filters.userIds ?? []
    }
    
    try {
      const params: Record<string, unknown> = {
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

      if (currentFilters.value.userIds.length > 0) {
        params.userIds = currentFilters.value.userIds.join(',')
      }
      
      const response = await photosApi.getPhotos(params)
      
      if (response.success && response.data) {
        photos.value = response.data.photos
        pagination.value = response.data.pagination
        return { success: true }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error: unknown) {
      console.error('Fetch photos error:', error)
      const err = error as { error?: string }
      return { success: false, error: err.error ?? 'Failed to fetch photos' }
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载更多图片（分页）
   */
  async function loadMore(): Promise<ActionResult> {
    if (!hasMore.value || loading.value) return { success: true }
    
    loading.value = true
    
    try {
      const params: Record<string, unknown> = {
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

      if (currentFilters.value.userIds.length > 0) {
        params.userIds = currentFilters.value.userIds.join(',')
      }
      
      const response = await photosApi.getPhotos(params)
      
      if (response.success && response.data) {
        // Filter out duplicates
        const newPhotos = response.data.photos.filter(
          (newPhoto) => !photos.value.some((existing) => existing.id === newPhoto.id)
        )
        photos.value = [...photos.value, ...newPhotos]
        pagination.value = response.data.pagination
        return { success: true }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error: unknown) {
      console.error('Load more photos error:', error)
      const err = error as { error?: string }
      return { success: false, error: err.error ?? 'Failed to load more photos' }
    } finally {
      loading.value = false
    }
  }

  /**
   * 上传图片
   */
  async function uploadPhotos(
    files: File[],
    tags: string[] = [],
    onProgress: UploadProgressCallback | null = null
  ): Promise<ActionResult<{ photos: Photo[] }>> {
    try {
      // 将标签数组转换为 "#标签1 #标签2" 格式
      const tagsStr = tags.length > 0 ? tags.map(t => `#${t}`).join(' ') : ''
      
      const response = await photosApi.uploadPhotos(files, tagsStr, onProgress)
      
      if (response.success && response.data) {
        // 刷新图片列表
        await fetchPhotos(currentFilters.value)
        return { success: true, data: { photos: response.data.photos } }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error: unknown) {
      console.error('Upload photos error:', error)
      const err = error as { error?: string }
      return { success: false, error: err.error ?? 'Failed to upload photos' }
    }
  }

  /**
   * 更新图片标签
   */
  async function updatePhotoTags(photoId: number, tags: string[]): Promise<ActionResult> {
    try {
      const response = await photosApi.updatePhotoTags(photoId, tags)
      
      if (response.success) {
        // 更新本地状态
        const index = photos.value.findIndex(p => p.id === photoId)
        if (index !== -1) {
          photos.value[index] = { ...photos.value[index], tags: tags.map((name, i) => ({ id: i, name, createdAt: '' })) }
        }
        return { success: true }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error: unknown) {
      console.error('Update photo tags error:', error)
      const err = error as { error?: string }
      return { success: false, error: err.error ?? 'Failed to update tags' }
    }
  }

  /**
   * 删除图片
   */
  async function deletePhoto(photoId: number): Promise<ActionResult> {
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
    } catch (error: unknown) {
      console.error('Delete photo error:', error)
      const err = error as { error?: string }
      return { success: false, error: err.error ?? 'Failed to delete photo' }
    }
  }

  /**
   * 批量更新标签
   */
  async function batchUpdateTags(
    photoIds: number[],
    tags: string[]
  ): Promise<ActionResult<{ updatedIds: number[] }>> {
    try {
      const response = await photosApi.batchUpdateTags(photoIds, tags)
      
      if (response.success && response.data) {
        // 更新本地状态
        const updatedIds = response.data.updatedIds
        photos.value.forEach(photo => {
          if (updatedIds.includes(photo.id)) {
            photo.tags = tags.map((name, i) => ({ id: i, name, createdAt: '' }))
          }
        })
        return { success: true, data: { updatedIds } }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error: unknown) {
      console.error('Batch update tags error:', error)
      const err = error as { error?: string }
      return { success: false, error: err.error ?? 'Failed to batch update tags' }
    }
  }

  /**
   * 批量删除图片
   */
  async function batchDelete(photoIds: number[]): Promise<ActionResult<{ deletedIds: number[] }>> {
    try {
      const response = await photosApi.batchDeletePhotos(photoIds)
      
      if (response.success && response.data) {
        // 从本地状态移除
        const deletedIds = response.data.deletedIds
        photos.value = photos.value.filter(p => !deletedIds.includes(p.id))
        pagination.value.total -= deletedIds.length
        return { success: true, data: { deletedIds } }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error: unknown) {
      console.error('Batch delete photos error:', error)
      const err = error as { error?: string }
      return { success: false, error: err.error ?? 'Failed to batch delete photos' }
    }
  }

  /**
   * 重置状态
   */
  function reset(): void {
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
      userId: null,
      userIds: []
    }
  }

  /**
   * 设置每页数量
   */
  function setPageLimit(limit: number): void {
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
