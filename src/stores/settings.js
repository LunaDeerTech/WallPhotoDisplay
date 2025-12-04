import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

// LocalStorage key
const SETTINGS_KEY = 'photowall_settings'

/**
 * Settings Store - 浏览设置状态管理
 */
export const useSettingsStore = defineStore('settings', () => {
  // State
  const columns = ref(4)                           // 瀑布流列数
  const selectedTags = ref([])                     // 筛选标签
  const theme = ref('system')                      // 主题: 'light' | 'dark' | 'system' | custom color
  const sortBy = ref('created_at_desc')           // 排序方式
  const customAccentColor = ref('#4a90d9')        // 自定义主题色

  // Load settings from localStorage
  function loadFromStorage() {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY)
      if (stored) {
        const settings = JSON.parse(stored)
        if (settings.columns) columns.value = settings.columns
        if (settings.selectedTags) selectedTags.value = settings.selectedTags
        if (settings.theme) theme.value = settings.theme
        if (settings.sortBy) sortBy.value = settings.sortBy
        if (settings.customAccentColor) customAccentColor.value = settings.customAccentColor
      }
    } catch (error) {
      console.error('Failed to load settings from storage:', error)
    }
  }

  // Save settings to localStorage
  function saveToStorage() {
    try {
      const settings = {
        columns: columns.value,
        selectedTags: selectedTags.value,
        theme: theme.value,
        sortBy: sortBy.value,
        customAccentColor: customAccentColor.value
      }
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save settings to storage:', error)
    }
  }

  // Watch for changes and auto-save
  watch([columns, selectedTags, theme, sortBy, customAccentColor], () => {
    saveToStorage()
  }, { deep: true })

  // Actions

  /**
   * 设置瀑布流列数
   * @param {number} value - 列数 (2-6)
   */
  function setColumns(value) {
    if (value >= 2 && value <= 6) {
      columns.value = value
    }
  }

  /**
   * 设置筛选标签
   * @param {string[]} tags - 标签数组
   */
  function setSelectedTags(tags) {
    selectedTags.value = tags
  }

  /**
   * 添加筛选标签
   * @param {string} tag - 标签名
   */
  function addSelectedTag(tag) {
    if (!selectedTags.value.includes(tag)) {
      selectedTags.value.push(tag)
    }
  }

  /**
   * 移除筛选标签
   * @param {string} tag - 标签名
   */
  function removeSelectedTag(tag) {
    const index = selectedTags.value.indexOf(tag)
    if (index !== -1) {
      selectedTags.value.splice(index, 1)
    }
  }

  /**
   * 切换筛选标签
   * @param {string} tag - 标签名
   */
  function toggleSelectedTag(tag) {
    if (selectedTags.value.includes(tag)) {
      removeSelectedTag(tag)
    } else {
      addSelectedTag(tag)
    }
  }

  /**
   * 清空筛选标签
   */
  function clearSelectedTags() {
    selectedTags.value = []
  }

  /**
   * 设置主题
   * @param {string} value - 主题值 ('light' | 'dark' | 'system' | custom color)
   */
  function setTheme(value) {
    theme.value = value
  }

  /**
   * 设置自定义主题色
   * @param {string} color - 颜色值 (如 '#4a90d9')
   */
  function setCustomAccentColor(color) {
    customAccentColor.value = color
    // 如果当前不是预设主题，则应用自定义颜色
    if (!['light', 'dark', 'system'].includes(theme.value)) {
      theme.value = color
    }
  }

  /**
   * 设置排序方式
   * @param {string} value - 排序值 ('created_at_desc' | 'created_at_asc' | 'random')
   */
  function setSortBy(value) {
    sortBy.value = value
  }

  /**
   * 重置所有设置为默认值
   */
  function resetToDefaults() {
    columns.value = 4
    selectedTags.value = []
    theme.value = 'system'
    sortBy.value = 'created_at_desc'
    customAccentColor.value = '#4a90d9'
  }

  // Initialize: load from storage
  loadFromStorage()

  return {
    // State
    columns,
    selectedTags,
    theme,
    sortBy,
    customAccentColor,
    
    // Actions
    setColumns,
    setSelectedTags,
    addSelectedTag,
    removeSelectedTag,
    toggleSelectedTag,
    clearSelectedTags,
    setTheme,
    setCustomAccentColor,
    setSortBy,
    resetToDefaults,
    loadFromStorage,
    saveToStorage
  }
})
