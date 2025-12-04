import request from '../utils/request.js'

/**
 * Auth API - 认证相关接口
 */
const authApi = {
  /**
   * 用户登录
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Promise<{success: boolean, data?: {token: string, user: Object}, error?: string}>}
   */
  login(username, password) {
    return request.post('/auth/login', { username, password })
  },

  /**
   * 用户登出
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  logout() {
    return request.post('/auth/logout')
  },

  /**
   * 获取当前用户信息
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  getCurrentUser() {
    return request.get('/auth/me')
  }
}

export default authApi
