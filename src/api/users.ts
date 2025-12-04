import request from '@/utils/request'
import type { ApiResponse, User, UserCreatePayload } from '@/types'

/**
 * 用户更新数据
 */
export interface UserUpdatePayload {
  displayName?: string
  role?: 'admin' | 'user'
}

/**
 * 密码更新数据
 */
export interface PasswordUpdatePayload {
  oldPassword?: string
  newPassword: string
}

/**
 * Users API - 用户管理相关接口
 */
const usersApi = {
  /**
   * 获取所有用户列表
   */
  getAll(): Promise<ApiResponse<User[]>> {
    return request.get('/users')
  },

  /**
   * 获取单个用户信息
   */
  getById(id: number): Promise<ApiResponse<User>> {
    return request.get(`/users/${id}`)
  },

  /**
   * 创建新用户
   */
  create(userData: UserCreatePayload): Promise<ApiResponse<User>> {
    return request.post('/users', userData)
  },

  /**
   * 更新用户信息
   */
  update(id: number, updates: UserUpdatePayload): Promise<ApiResponse<User>> {
    return request.put(`/users/${id}`, updates)
  },

  /**
   * 删除用户
   */
  delete(id: number): Promise<ApiResponse<void>> {
    return request.delete(`/users/${id}`)
  },

  /**
   * 修改用户密码
   */
  updatePassword(id: number, { oldPassword, newPassword }: PasswordUpdatePayload): Promise<ApiResponse<void>> {
    return request.put(`/users/${id}/password`, { oldPassword, newPassword })
  }
}

export default usersApi
