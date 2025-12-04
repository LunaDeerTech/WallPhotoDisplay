import request from '@/utils/request'
import type { ApiResponse, LoginResponse, User } from '@/types'

/**
 * Auth API - 认证相关接口
 */
const authApi = {
  /**
   * 用户登录
   * @param username - 用户名
   * @param password - 密码
   */
  login(username: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return request.post('/auth/login', { username, password })
  },

  /**
   * 用户登出
   */
  logout(): Promise<ApiResponse<void>> {
    return request.post('/auth/logout')
  },

  /**
   * 获取当前用户信息
   */
  getCurrentUser(): Promise<ApiResponse<User>> {
    return request.get('/auth/me')
  }
}

export default authApi
