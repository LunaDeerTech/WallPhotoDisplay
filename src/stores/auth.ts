import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import authApi from '@/api/auth'
import { setToken, removeToken, getToken, hasToken } from '@/utils/request'
import type { User, UserCreatePayload } from '@/types'

/**
 * 登录结果
 */
export interface LoginResult {
  success: boolean
  error?: string
}

/**
 * 注册结果
 */
export interface RegisterResult {
  success: boolean
  error?: string
}

/**
 * Auth Store - 用户认证状态管理
 */
export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string | null>(getToken())
  const user = ref<User | null>(null)
  const loading = ref(false)

  // Getters
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const currentUserId = computed(() => user.value?.id ?? null)
  const displayName = computed(() => user.value?.displayName ?? user.value?.username ?? '')

  // Actions
  
  /**
   * 用户登录
   */
  async function login(username: string, password: string): Promise<LoginResult> {
    loading.value = true
    try {
      const response = await authApi.login(username, password)
      
      if (response.success && response.data) {
        token.value = response.data.token
        user.value = response.data.user
        setToken(response.data.token)
        return { success: true }
      } else {
        return { success: false, error: response.error ?? 'Login failed' }
      }
    } catch (error: unknown) {
      console.error('Login error:', error)
      const err = error as { error?: string }
      return { success: false, error: err.error ?? 'Login failed' }
    } finally {
      loading.value = false
    }
  }

  /**
   * 用户注册
   */
  async function register(payload: UserCreatePayload): Promise<RegisterResult> {
    loading.value = true
    try {
      const response = await authApi.register(payload)
      
      if (response.success && response.data) {
        // 注册成功后自动登录
        token.value = response.data.token
        user.value = response.data.user
        setToken(response.data.token)
        return { success: true }
      } else {
        return { success: false, error: response.error ?? 'Register failed' }
      }
    } catch (error: unknown) {
      console.error('Register error:', error)
      const err = error as { error?: string }
      return { success: false, error: err.error ?? 'Register failed' }
    } finally {
      loading.value = false
    }
  }

  /**
   * 用户登出
   */
  async function logout(): Promise<void> {
    try {
      // Call logout API (optional, JWT is stateless)
      if (token.value) {
        await authApi.logout().catch(() => {})
      }
    } finally {
      // Clear local state
      token.value = null
      user.value = null
      removeToken()
    }
  }

  /**
   * 获取当前用户信息
   * 用于应用启动时恢复登录状态
   */
  async function fetchCurrentUser(): Promise<boolean> {
    if (!hasToken()) {
      return false
    }

    loading.value = true
    try {
      const response = await authApi.getCurrentUser()
      
      if (response.success && response.data) {
        user.value = response.data
        return true
      } else {
        // Token invalid, clear state
        await logout()
        return false
      }
    } catch (error) {
      console.error('Fetch current user error:', error)
      // Token invalid, clear state
      await logout()
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新当前用户的显示名称
   */
  function updateUserDisplayName(newDisplayName: string): void {
    if (user.value) {
      user.value = { ...user.value, displayName: newDisplayName }
    }
  }

  /**
   * 更新当前用户的邮箱状态
   */
  function updateUserEmail(email: string, verified: boolean): void {
    if (user.value) {
      user.value = { ...user.value, email, emailVerified: verified }
    }
  }

  /**
   * 发送邮箱验证码
   */
  async function sendVerificationCode(email: string): Promise<boolean> {
    try {
      const response = await authApi.sendVerificationCode(email)
      return response.success
    } catch (error) {
      console.error('Send verification code error:', error)
      return false
    }
  }

  /**
   * 验证邮箱
   */
  async function verifyEmail(email: string, code: string): Promise<boolean> {
    try {
      const response = await authApi.verifyEmail(email, code)
      if (response.success) {
        updateUserEmail(email, true)
        return true
      }
      return false
    } catch (error) {
      console.error('Verify email error:', error)
      return false
    }
  }

  /**
   * 初始化认证状态
   * 应用启动时调用
   */
  async function init(): Promise<void> {
    if (hasToken()) {
      await fetchCurrentUser()
    }
  }

  // Listen for unauthorized events (from request interceptor)
  if (typeof window !== 'undefined') {
    window.addEventListener('auth:unauthorized', () => {
      logout()
    })
  }

  return {
    // State
    token,
    user,
    loading,
    
    // Getters
    isLoggedIn,
    isAdmin,
    currentUserId,
    displayName,
    
    // Actions
    login,
    register,
    logout,
    fetchCurrentUser,
    updateUserDisplayName,
    updateUserEmail,
    sendVerificationCode,
    verifyEmail,
    init
  }
})
