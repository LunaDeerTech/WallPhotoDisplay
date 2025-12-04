import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '../stores/settings.js'

/**
 * useTheme composable - 主题管理
 * 
 * 支持以下主题模式:
 * - 'light': 明亮主题
 * - 'dark': 暗黑主题
 * - 'system': 跟随系统
 * - 自定义颜色值 (如 '#4a90d9'): 自定义主题色
 */
export function useTheme() {
  const settingsStore = useSettingsStore()
  
  // Current effective theme (light/dark)
  const effectiveTheme = ref('light')
  
  // System preference media query
  let mediaQuery = null
  
  /**
   * 根据设置值计算生效的主题
   */
  function getEffectiveTheme(theme) {
    if (theme === 'system') {
      return mediaQuery?.matches ? 'dark' : 'light'
    }
    if (theme === 'light' || theme === 'dark') {
      return theme
    }
    // Custom color - use light theme as base
    return 'light'
  }
  
  /**
   * 检查是否为自定义颜色
   */
  function isCustomColor(theme) {
    return theme && theme.startsWith('#')
  }
  
  /**
   * 生成自定义颜色的变体
   */
  function generateColorVariants(baseColor) {
    // Parse hex color
    const hex = baseColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    
    // Generate hover color (slightly darker)
    const hoverR = Math.max(0, Math.floor(r * 0.85))
    const hoverG = Math.max(0, Math.floor(g * 0.85))
    const hoverB = Math.max(0, Math.floor(b * 0.85))
    const hoverColor = `#${hoverR.toString(16).padStart(2, '0')}${hoverG.toString(16).padStart(2, '0')}${hoverB.toString(16).padStart(2, '0')}`
    
    // Generate light color (with alpha)
    const lightColor = `rgba(${r}, ${g}, ${b}, 0.1)`
    const lighterColor = `rgba(${r}, ${g}, ${b}, 0.05)`
    
    return {
      base: baseColor,
      hover: hoverColor,
      light: lightColor,
      lighter: lighterColor
    }
  }
  
  /**
   * 应用主题到 DOM
   */
  function applyTheme(theme) {
    const html = document.documentElement
    
    // Determine base theme (light/dark)
    const baseTheme = getEffectiveTheme(theme)
    effectiveTheme.value = baseTheme
    
    // Check for custom color
    const hasCustomColor = isCustomColor(theme)
    
    if (hasCustomColor) {
      // Apply custom color theme
      const variants = generateColorVariants(theme)
      
      // Set data-theme for base dark/light styles
      html.dataset.theme = baseTheme === 'dark' ? 'custom-dark' : 'custom'
      
      // Set CSS custom properties for accent color
      html.style.setProperty('--custom-accent-color', variants.base)
      html.style.setProperty('--custom-accent-hover', variants.hover)
      html.style.setProperty('--custom-accent-light', variants.light)
      html.style.setProperty('--custom-accent-lighter', variants.lighter)
    } else {
      // Apply standard theme
      html.dataset.theme = baseTheme
      
      // Remove custom color properties
      html.style.removeProperty('--custom-accent-color')
      html.style.removeProperty('--custom-accent-hover')
      html.style.removeProperty('--custom-accent-light')
      html.style.removeProperty('--custom-accent-lighter')
    }
    
    // Update meta theme-color for mobile browsers
    updateMetaThemeColor(baseTheme)
  }
  
  /**
   * 更新 meta theme-color 标签
   */
  function updateMetaThemeColor(theme) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]')
    
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta')
      metaThemeColor.setAttribute('name', 'theme-color')
      document.head.appendChild(metaThemeColor)
    }
    
    // Set appropriate color based on theme
    const themeColor = theme === 'dark' ? '#000000' : '#ffffff'
    metaThemeColor.setAttribute('content', themeColor)
  }
  
  /**
   * 处理系统主题变化
   */
  function handleSystemThemeChange(event) {
    if (settingsStore.theme === 'system') {
      applyTheme('system')
    }
  }
  
  /**
   * 设置主题
   */
  function setTheme(theme) {
    settingsStore.setTheme(theme)
    applyTheme(theme)
  }
  
  /**
   * 切换明暗主题
   */
  function toggleDarkMode() {
    const newTheme = effectiveTheme.value === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }
  
  /**
   * 设置自定义主题色
   */
  function setCustomColor(color) {
    if (color && /^#[0-9A-Fa-f]{6}$/.test(color)) {
      settingsStore.setCustomAccentColor(color)
      setTheme(color)
    }
  }
  
  /**
   * 初始化主题
   */
  function initTheme() {
    // Setup system theme detection
    if (typeof window !== 'undefined' && window.matchMedia) {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', handleSystemThemeChange)
    }
    
    // Apply initial theme from store
    applyTheme(settingsStore.theme)
  }
  
  /**
   * 清理
   */
  function cleanup() {
    if (mediaQuery) {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }
  
  // Watch for theme changes in store
  watch(() => settingsStore.theme, (newTheme) => {
    applyTheme(newTheme)
  })
  
  // Lifecycle hooks (for use in components)
  onMounted(() => {
    initTheme()
  })
  
  onUnmounted(() => {
    cleanup()
  })
  
  return {
    effectiveTheme,
    setTheme,
    toggleDarkMode,
    setCustomColor,
    applyTheme,
    initTheme,
    cleanup
  }
}

/**
 * 预设主题色
 */
export const presetColors = [
  { name: '蓝色', value: '#007AFF' },
  { name: '紫色', value: '#AF52DE' },
  { name: '粉色', value: '#FF2D55' },
  { name: '红色', value: '#FF3B30' },
  { name: '橙色', value: '#FF9500' },
  { name: '黄色', value: '#FFCC00' },
  { name: '绿色', value: '#34C759' },
  { name: '青色', value: '#5AC8FA' },
  { name: '靛蓝', value: '#5856D6' }
]

export default useTheme
