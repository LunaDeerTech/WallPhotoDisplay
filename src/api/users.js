import request from '../utils/request.js'

/**
 * Users API - 用户管理相关接口
 */
const usersApi = {
  /**
   * 获取所有用户列表
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  getAll() {
    return request.get('/users')
  },

  /**
   * 获取单个用户信息
   * @param {number} id - 用户 ID
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  getById(id) {
    return request.get(`/users/${id}`)
  },

  /**
   * 创建新用户
   * @param {Object} userData - 用户数据
   * @param {string} userData.username - 用户名（登录账号）
   * @param {string} userData.password - 密码
   * @param {string} [userData.displayName] - 显示名称
   * @param {string} [userData.role='user'] - 用户角色 ('admin' | 'user')
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  create(userData) {
    return request.post('/users', userData)
  },

  /**
   * 更新用户信息
   * @param {number} id - 用户 ID
   * @param {Object} updates - 更新数据
   * @param {string} [updates.displayName] - 显示名称
   * @param {string} [updates.role] - 用户角色（仅管理员可修改）
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  update(id, updates) {
    return request.put(`/users/${id}`, updates)
  },

  /**
   * 删除用户
   * @param {number} id - 用户 ID
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  delete(id) {
    return request.delete(`/users/${id}`)
  },

  /**
   * 修改用户密码
   * @param {number} id - 用户 ID
   * @param {Object} passwords - 密码数据
   * @param {string} [passwords.oldPassword] - 旧密码（非管理员修改自己密码时必填）
   * @param {string} passwords.newPassword - 新密码
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  updatePassword(id, { oldPassword, newPassword }) {
    return request.put(`/users/${id}/password`, { oldPassword, newPassword })
  }
}

export default usersApi
