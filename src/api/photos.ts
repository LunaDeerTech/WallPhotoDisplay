import request from '@/utils/request'
import type { ApiResponse, Photo } from '@/types'
import type { AxiosProgressEvent } from 'axios'

/**
 * 图片查询参数
 */
export interface PhotoQueryParams {
  page?: number
  limit?: number
  tags?: string
  sort?: 'created_at_desc' | 'created_at_asc' | 'random'
  userId?: number
  userIds?: string
  status?: 'pending' | 'approved' | 'rejected'
}

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
 * 图片列表响应
 */
export interface PhotoListResponse {
  photos: Photo[]
  pagination: Pagination
}

/**
 * 上传响应
 */
export interface UploadResponse {
  photos: Photo[]
  errors?: Array<{ filename: string; error: string }>
}

/**
 * 批量删除响应
 */
export interface BatchDeleteResponse {
  deletedIds: number[]
  errors?: Array<{ id: number; error: string }>
}

/**
 * 批量更新标签响应
 */
export interface BatchUpdateTagsResponse {
  updatedIds: number[]
  tags: string[]
  errors?: Array<{ id: number; error: string }>
}

/**
 * 上传进度回调类型
 */
export type UploadProgressCallback = (percent: number, event: AxiosProgressEvent) => void

/**
 * Photos API - 图片相关接口
 */
const photosApi = {
  /**
   * 获取图片列表（支持分页、筛选、排序）
   */
  getPhotos(params: PhotoQueryParams = {}): Promise<ApiResponse<PhotoListResponse>> {
    return request.get('/photos', { params })
  },

  /**
   * 获取当前用户的图片
   */
  getMyPhotos(params: PhotoQueryParams = {}): Promise<ApiResponse<PhotoListResponse>> {
    return request.get('/photos/my', { params })
  },

  /**
   * 获取单张图片详情
   */
  getPhotoById(id: number): Promise<ApiResponse<Photo>> {
    return request.get(`/photos/${id}`)
  },

  /**
   * 上传图片
   * @param files - 图片文件数组
   * @param tags - 标签字符串，格式: "#标签1 #标签2"
   * @param onUploadProgress - 上传进度回调
   */
  uploadPhotos(
    files: File[],
    tags: string = '',
    onUploadProgress: UploadProgressCallback | null = null
  ): Promise<ApiResponse<UploadResponse>> {
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
      onUploadProgress: onUploadProgress ? (progressEvent: AxiosProgressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
        onUploadProgress(percentCompleted, progressEvent)
      } : undefined
    })
  },

  /**
   * 更新图片标签
   */
  updatePhotoTags(id: number, tags: string[]): Promise<ApiResponse<{ id: number; tags: string[] }>> {
    return request.put(`/photos/${id}/tags`, { tags })
  },

  /**
   * 删除图片
   */
  deletePhoto(id: number): Promise<ApiResponse<void>> {
    return request.delete(`/photos/${id}`)
  },

  /**
   * 批量删除图片
   */
  batchDeletePhotos(ids: number[]): Promise<ApiResponse<BatchDeleteResponse>> {
    return request.delete('/photos/batch', { data: { ids } })
  },

  /**
   * 批量更新图片标签
   */
  batchUpdateTags(ids: number[], tags: string[]): Promise<ApiResponse<BatchUpdateTagsResponse>> {
    return request.put('/photos/batch/tags', { ids, tags })
  },

  /**
   * 获取待审核图片
   */
  getPendingPhotos(params?: PhotoQueryParams): Promise<ApiResponse<PhotoListResponse>> {
    return request.get('/photos/pending', { params })
  },

  /**
   * 审核图片
   */
  reviewPhoto(id: number, action: 'approve' | 'reject'): Promise<ApiResponse<Photo>> {
    return request.post(`/photos/${id}/review`, { action })
  },

  /**
   * 批量审核图片
   */
  batchReviewPhotos(ids: number[], action: 'approve' | 'reject'): Promise<ApiResponse<{ count: number }>> {
    return request.post('/batch/review', { ids, action })
  },

  /**
   * 点赞/取消点赞图片
   */
  toggleLike(photoId: number): Promise<ApiResponse<{ id: number; isLiked: boolean; likeCount: number }>> {
    return request.post(`/photos/${photoId}/like`)
  },

  /**
   * 获取图片点赞状态
   */
  getLikeStatus(photoId: number): Promise<ApiResponse<{ id: number; isLiked: boolean; likeCount: number }>> {
    return request.get(`/photos/${photoId}/like-status`)
  }
}

export default photosApi
