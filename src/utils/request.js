import axios from 'axios'

// Create axios instance
const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Token storage key
const TOKEN_KEY = 'photowall_token'

/**
 * Get stored token
 * @returns {string|null}
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Set token to storage
 * @param {string} token
 */
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

/**
 * Remove token from storage
 */
export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * Check if user is authenticated (has token)
 * @returns {boolean}
 */
export function hasToken() {
  return !!getToken()
}

// Request interceptor - add JWT token to headers
request.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors
request.interceptors.response.use(
  (response) => {
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
