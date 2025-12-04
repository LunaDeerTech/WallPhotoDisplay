import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { ThemeMode, SortBy } from '@/types'

// LocalStorage key
const SETTINGS_KEY = 'photowall_settings'

/**
 * 存储的设置数据结构
 */
interface StoredSettings {
  columns?: number
  selectedTags?: string[]
  theme?: ThemeMode
  sortBy?: SortBy
  customAccentColor?: string
}

/**
 * Settings Store - 浏览设置状态管理
 */
export const useSettingsStore = defineStore('settings', () => {
  // State
  const columns = ref<number>(4)                              // 瀑布流列数
  const selectedTags = ref<string[]>([])                      // 筛选标签
  const theme = ref<ThemeMode>('system')                      // 主题
  const sortBy = ref<SortBy>('created_at_desc')                        // 排序方式
  const customAccentColor = ref<string>('#4a90d9')            // 自定义主题色

  // Load settings from localStorage
  function loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY)
      if (stored) {
        const settings: StoredSettings = JSON.parse(stored)
        if (settings.columns !== undefined) columns.value = settings.columns
        if (settings.selectedTags !== undefined) selectedTags.value = settings.selectedTags
        if (settings.theme !== undefined) theme.value = settings.theme
        if (settings.sortBy !== undefined) sortBy.value = settings.sortBy
        if (settings.customAccentColor !== undefined) customAccentColor.value = settings.customAccentColor
      }
    } catch (error) {
      console.error('Failed to load settings from storage:', error)
    }
  }

  // Save settings to localStorage
  function saveToStorage(): void {
    try {
      const settings: StoredSettings = {
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
   */
  function setColumns(value: number): void {
    if (value >= 2 && value <= 6) {
      columns.value = value
    }
  }

  /**
   * 设置筛选标签
   */
  function setSelectedTags(tags: string[]): void {
    selectedTags.value = tags
  }

  /**
   * 添加筛选标签
   */
  function addSelectedTag(tag: string): void {
    if (!selectedTags.value.includes(tag)) {
      selectedTags.value.push(tag)
    }
  }

  /**
   * 移除筛选标签
   */
  function removeSelectedTag(tag: string): void {
    const index = selectedTags.value.indexOf(tag)
    if (index !== -1) {
      selectedTags.value.splice(index, 1)
    }
  }

  /**
   * 切换筛选标签
   */
  function toggleSelectedTag(tag: string): void {
    if (selectedTags.value.includes(tag)) {
      removeSelectedTag(tag)
    } else {
      addSelectedTag(tag)
    }
  }

  /**
   * 清空筛选标签
   */
  function clearSelectedTags(): void {
    selectedTags.value = []
  }

  /**
   * 设置主题
   */
  function setTheme(value: ThemeMode): void {
    theme.value = value
  }

  /**
   * 设置自定义主题色
   */
  function setCustomAccentColor(color: string): void {
    customAccentColor.value = color
    // 如果当前不是预设主题，则应用自定义颜色
    if (!['light', 'dark', 'system'].includes(theme.value)) {
      theme.value = 'custom'
    }
  }

  /**
   * 设置排序方式
   */
  function setSortBy(value: SortBy): void {
    sortBy.value = value
  }

  /**
   * 重置所有设置为默认值
   */
  function resetToDefaults(): void {
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
