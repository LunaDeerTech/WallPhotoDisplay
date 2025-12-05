<template>
  <div class="browse-settings-content">
    <!-- Columns setting -->
    <div class="setting-group">
      <div class="setting-header">
        <label class="setting-label">瀑布流列数</label>
        <span class="setting-value">{{ localSettings.columns }} 列</span>
      </div>
      <div class="column-options">
        <button
          v-for="col in columnOptions"
          :key="col"
          type="button"
          class="column-option"
          :class="{ active: localSettings.columns === col }"
          @click="updateSetting('columns', col)"
        >
          <div class="column-preview">
            <span v-for="i in col" :key="i" class="column-bar" />
          </div>
          <span class="column-label">{{ col }}</span>
        </button>
      </div>
    </div>

    <!-- Sort setting -->
    <div class="setting-group">
      <label class="setting-label">排序方式</label>
      <div class="sort-options">
        <button
          v-for="option in sortOptions"
          :key="option.value"
          type="button"
          class="sort-option"
          :class="{ active: localSettings.sortBy === option.value }"
          @click="updateSetting('sortBy', option.value)"
        >
          <svg class="sort-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path v-if="option.value === 'created_at_desc'" d="M12 5v14M19 12l-7 7-7-7"/>
            <path v-else-if="option.value === 'created_at_asc'" d="M12 19V5M5 12l7-7 7 7"/>
            <g v-else>
              <path d="M16 3h5v5M4 20L21 3"/>
              <circle cx="12" cy="12" r="3"/>
            </g>
          </svg>
          <span>{{ option.label }}</span>
        </button>
      </div>
    </div>

    <!-- Theme setting -->
    <div class="setting-group">
      <label class="setting-label">界面主题</label>
      <div class="theme-options">
        <button
          v-for="option in themeOptions"
          :key="option.value"
          type="button"
          class="theme-option"
          :class="{ active: localSettings.theme === option.value }"
          @click="updateSetting('theme', option.value)"
        >
          <div class="theme-preview" :class="option.value">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle v-if="option.value === 'light'" cx="12" cy="12" r="5"/>
              <path v-if="option.value === 'light'" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              <path v-else-if="option.value === 'dark'" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              <g v-else-if="option.value === 'system'">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </g>
            </svg>
          </div>
          <span>{{ option.label }}</span>
        </button>
      </div>
      
      <!-- Custom color picker (when theme is custom) -->
      <div v-if="localSettings.theme === 'custom'" class="color-picker-section">
        <label class="color-label">自定义主题色</label>
        <div class="color-picker-wrapper">
          <input
            type="color"
            v-model="localSettings.customAccentColor"
            class="color-picker"
            @change="updateSetting('customAccentColor', localSettings.customAccentColor)"
          />
          <span class="color-value">{{ localSettings.customAccentColor }}</span>
        </div>
        <div class="preset-colors">
          <button
            v-for="color in presetColors"
            :key="color"
            type="button"
            class="preset-color"
            :style="{ backgroundColor: color }"
            :class="{ active: localSettings.customAccentColor === color }"
            @click="updateSetting('customAccentColor', color)"
            :aria-label="`选择颜色 ${color}`"
          />
        </div>
      </div>
    </div>

    <div class="actions-footer">
      <button
        type="button"
        class="btn btn-text"
        @click="resetToDefaults"
      >
        恢复默认
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useTheme } from '@/composables/useTheme'
import type { ThemeMode, SortBy } from '@/types'

const settingsStore = useSettingsStore()
const { applyTheme } = useTheme()

interface LocalSettings {
  columns: number
  sortBy: SortBy
  theme: ThemeMode
  customAccentColor: string
}

const localSettings = reactive<LocalSettings>({
  columns: 4,
  sortBy: 'created_at_desc',
  theme: 'system',
  customAccentColor: '#007AFF'
})

// Options
const columnOptions = [2, 3, 4, 5, 6]

interface SortOption {
  value: SortBy
  label: string
}

const sortOptions: SortOption[] = [
  { value: 'created_at_desc', label: '最新优先' },
  { value: 'created_at_asc', label: '最早优先' },
  { value: 'random', label: '随机排序' }
]

interface ThemeOption {
  value: ThemeMode
  label: string
}

const themeOptions: ThemeOption[] = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'system', label: '跟随系统' },
  { value: 'custom', label: '自定义' }
]

const presetColors: string[] = [
  '#007AFF', // iOS Blue
  '#5856D6', // Purple
  '#AF52DE', // Violet
  '#FF2D55', // Pink
  '#FF3B30', // Red
  '#FF9500', // Orange
  '#FFCC00', // Yellow
  '#34C759', // Green
  '#00C7BE', // Teal
  '#5AC8FA'  // Cyan
]

// Sync local settings on mount
onMounted(() => {
  localSettings.columns = settingsStore.columns
  localSettings.sortBy = settingsStore.sortBy
  localSettings.theme = settingsStore.theme
  localSettings.customAccentColor = settingsStore.customAccentColor
})

function updateSetting(key: keyof LocalSettings, value: any) {
  // Update local state
  (localSettings as any)[key] = value
  
  // Update store
  if (key === 'columns') settingsStore.setColumns(value)
  if (key === 'sortBy') settingsStore.setSortBy(value)
  if (key === 'theme') {
    settingsStore.setTheme(value)
    applyTheme(value)
  }
  if (key === 'customAccentColor') {
    settingsStore.setCustomAccentColor(value)
    if (localSettings.theme === 'custom') {
      applyTheme('custom')
    }
  }
}

// Reset to defaults
function resetToDefaults(): void {
  updateSetting('columns', 4)
  updateSetting('sortBy', 'created_at_desc')
  updateSetting('theme', 'system')
  updateSetting('customAccentColor', '#007AFF')
}
</script>

<style scoped>
.browse-settings-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  padding: var(--spacing-md);
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.setting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.setting-label {
  font-weight: 600;
  color: var(--color-text-primary);
}

.setting-value {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

/* Column options */
.column-options {
  display: flex;
  gap: var(--spacing-sm);
}

.column-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.column-option:hover {
  background: var(--color-bg-tertiary);
}

.column-option.active {
  border-color: var(--color-accent);
  background: var(--color-accent-light);
  color: var(--color-accent);
}

.column-preview {
  display: flex;
  gap: 2px;
  height: 20px;
  align-items: flex-end;
}

.column-bar {
  width: 4px;
  background: currentColor;
  border-radius: 1px;
  opacity: 0.5;
}

.column-bar:nth-child(odd) {
  height: 60%;
}

.column-bar:nth-child(even) {
  height: 100%;
}

.column-label {
  font-size: 0.75rem;
  font-weight: 500;
}

/* Sort options */
.sort-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
}

.sort-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 0.875rem;
}

.sort-option:hover {
  background: var(--color-bg-tertiary);
}

.sort-option.active {
  border-color: var(--color-accent);
  background: var(--color-accent-light);
  color: var(--color-accent);
}

.sort-icon {
  width: 20px;
  height: 20px;
}

/* Theme options */
.theme-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-sm);
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 0.875rem;
}

.theme-option:hover {
  background: var(--color-bg-tertiary);
}

.theme-option.active {
  border-color: var(--color-accent);
  background: var(--color-accent-light);
  color: var(--color-accent);
}

.theme-preview {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

.theme-option.active .theme-preview {
  color: var(--color-accent);
}

.theme-preview.light {
  background: #f5f5f7;
  color: #1d1d1f;
}

.theme-preview.dark {
  background: #1d1d1f;
  color: #f5f5f7;
}

.theme-preview.system {
  background: linear-gradient(135deg, #f5f5f7 50%, #1d1d1f 50%);
  color: #86868b;
}

.theme-preview.custom {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
}

/* Color picker */
.color-picker-section {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

.color-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: var(--spacing-sm);
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.color-picker {
  -webkit-appearance: none;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  padding: 0;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker::-webkit-color-swatch {
  border: none;
  border-radius: 50%;
  border: 2px solid var(--color-border);
}

.color-value {
  font-family: monospace;
  color: var(--color-text-secondary);
}

.preset-colors {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.preset-color {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.preset-color:hover {
  transform: scale(1.1);
}

.preset-color.active {
  border-color: var(--color-text-primary);
  transform: scale(1.1);
}

.actions-footer {
  display: flex;
  justify-content: flex-start;
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

.btn-text {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0;
  font-size: 0.875rem;
}

.btn-text:hover {
  color: var(--color-text-primary);
}
</style>
