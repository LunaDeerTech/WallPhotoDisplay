import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'

// Token storage key
const TOKEN_KEY = 'photowall_token'

// Create axios instance
const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * Get stored token
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Set token to storage
 */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

/**
 * Remove token from storage
 */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * Check if user is authenticated (has token)
 */
export function hasToken(): boolean {
  return !!getToken()
}

// Request interceptor - add JWT token to headers
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: Error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors
request.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  (error) => {
    // Handle authentication errors
    if (error.response) {
      const { status, data } = error.response
      
      if (status === 401) {
        // Token invalid or expired, clear token
        removeToken()
        // Optionally emit an event for the app to handle logout
        window.dispatchEvent(new CustomEvent('auth:unauthorized'))
      }
      
      // Return the error response data if available
      return Promise.reject(data || { success: false, error: error.message })
    }
    
    // Network or other errors
    return Promise.reject({
      success: false,
      error: error.message || 'Network error'
    })
  }
)

export default request
