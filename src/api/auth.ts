import request from '@/utils/request'
import type { ApiResponse, LoginResponse, User, UserCreatePayload } from '@/types'

/**
 * 验证码响应
 */
export interface CaptchaResponse {
  captchaId: string
  captchaSvg: string
}

/**
 * Auth API - 认证相关接口
 */
const authApi = {
  /**
   * 获取验证码
   */
  getCaptcha(): Promise<ApiResponse<CaptchaResponse>> {
    return request.get('/auth/captcha')
  },

  /**
   * 用户登录
   * @param username - 用户名
   * @param password - 密码
   * @param captchaId - 验证码ID
   * @param captchaText - 验证码输入
   */
  login(username: string, password: string, captchaId?: string, captchaText?: string): Promise<ApiResponse<LoginResponse>> {
    return request.post('/auth/login', { username, password, captchaId, captchaText })
  },

  /**
   * 用户注册
   * @param payload - 注册信息
   * @param captchaId - 验证码ID
   * @param captchaText - 验证码输入
   */
  register(payload: UserCreatePayload, captchaId?: string, captchaText?: string): Promise<ApiResponse<LoginResponse>> {
    return request.post('/auth/register', { ...payload, captchaId, captchaText })
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
  },

  /**
   * 发送邮箱验证码
   */
  sendVerificationCode(email: string): Promise<ApiResponse<void>> {
    return request.post('/auth/send-verification-code', { email })
  },

  /**
   * 验证邮箱
   */
  verifyEmail(email: string, code: string): Promise<ApiResponse<void>> {
    return request.post('/auth/verify-email', { email, code })
  },

  /**
   * 密码重置
   * @param identifier - 用户名或邮箱
   * @param captchaId - 验证码ID
   * @param captchaText - 验证码输入
   */
  resetPassword(identifier: string, captchaId?: string, captchaText?: string): Promise<ApiResponse<void>> {
    return request.post('/auth/reset-password', { identifier, captchaId, captchaText })
  }
}

export default authApi
