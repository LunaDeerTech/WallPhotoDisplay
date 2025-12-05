<template>
  <Modal
    v-model="isOpen"
    title="浏览设置"
    subtitle="自定义图片展示方式"
    size="md"
    @close="handleClose"
  >
    <div class="settings-content">
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
            @click="localSettings.columns = col"
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
            @click="localSettings.sortBy = option.value"
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
            @click="localSettings.theme = option.value"
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
              @click="localSettings.customAccentColor = color"
              :aria-label="`选择颜色 ${color}`"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- @vue-ignore -->
    <template #footer>
      <div class="dialog-actions">
        <button
          type="button"
          class="btn btn-text"
          @click="resetToDefaults"
        >
          恢复默认
        </button>
        <div class="actions-right">
          <button
            type="button"
            class="btn btn-secondary"
            @click="handleClose"
          >
            取消
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="handleSave"
          >
            保存
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed, watch, reactive } from 'vue'
import Modal from '../common/Modal.vue'
import TagSelector from '../common/TagSelector.vue'
import { useSettingsStore } from '@/stores/settings'
import { useTheme } from '@/composables/useTheme'
import type { ThemeMode, SortBy } from '@/types'

interface Props {
  modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const settingsStore = useSettingsStore()
const { applyTheme } = useTheme()

// Local state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

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

// Sync local settings when dialog opens
watch(isOpen, (newValue) => {
  if (newValue) {
    localSettings.columns = settingsStore.columns
    localSettings.sortBy = settingsStore.sortBy
    localSettings.theme = settingsStore.theme
    localSettings.customAccentColor = settingsStore.customAccentColor
  }
})

// Handle close
function handleClose(): void {
  isOpen.value = false
}

// Handle save
function handleSave(): void {
  settingsStore.setColumns(localSettings.columns)
  settingsStore.setSortBy(localSettings.sortBy)
  settingsStore.setTheme(localSettings.theme)
  settingsStore.setCustomAccentColor(localSettings.customAccentColor)
  
  // Apply theme
  applyTheme(localSettings.theme)
  
  isOpen.value = false
}

// Reset to defaults
function resetToDefaults(): void {
  localSettings.columns = 4
  localSettings.sortBy = 'created_at_desc'
  localSettings.theme = 'system'
  localSettings.customAccentColor = '#007AFF'
}
</script>

<style scoped>
.settings-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.setting-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.setting-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.setting-value {
  font-size: var(--font-size-sm);
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
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.column-option:hover {
  border-color: var(--color-accent);
  background-color: var(--color-accent-lighter);
}

.column-option.active {
  border-color: var(--color-accent);
  background-color: var(--color-accent-light);
}

.column-preview {
  display: flex;
  gap: 2px;
  height: 24px;
}

.column-bar {
  width: 6px;
  background-color: var(--color-border);
  border-radius: 2px;
  transition: background-color var(--transition-fast);
}

.column-option.active .column-bar {
  background-color: var(--color-accent);
}

.column-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.column-option.active .column-label {
  color: var(--color-accent);
  font-weight: var(--font-weight-medium);
}

/* Sort options */
.sort-options {
  display: flex;
  gap: var(--spacing-sm);
}

.sort-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-primary);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.sort-option:hover {
  border-color: var(--color-accent);
  background-color: var(--color-accent-lighter);
}

.sort-option.active {
  border-color: var(--color-accent);
  background-color: var(--color-accent-light);
  color: var(--color-accent);
}

.sort-icon {
  width: 18px;
  height: 18px;
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
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-primary);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.theme-option:hover {
  border-color: var(--color-accent);
  background-color: var(--color-accent-lighter);
}

.theme-option.active {
  border-color: var(--color-accent);
  background-color: var(--color-accent-light);
  color: var(--color-accent);
}

.theme-preview {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.theme-preview.light {
  background-color: #f7f7f7;
  color: #1c1c1e;
}

.theme-preview.dark {
  background-color: #1c1c1e;
  color: #f7f7f7;
}

.theme-preview.system {
  background: linear-gradient(135deg, #f7f7f7 50%, #1c1c1e 50%);
  color: #6e6e73;
}

.theme-preview.custom {
  background-color: var(--color-accent);
  color: white;
}

.theme-preview svg {
  width: 24px;
  height: 24px;
}

/* Color picker */
.color-picker-section {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-separator);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.color-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.color-picker {
  width: 48px;
  height: 48px;
  padding: 0;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  overflow: hidden;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker::-webkit-color-swatch {
  border: none;
  border-radius: var(--radius-sm);
}

.color-value {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

.preset-colors {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.preset-color {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.preset-color:hover {
  transform: scale(1.1);
}

.preset-color.active {
  border-color: var(--color-text-primary);
  box-shadow: 0 0 0 2px var(--color-bg-primary);
}

/* Clear tags button */
.clear-tags-btn {
  font-size: var(--font-size-sm);
  color: var(--color-accent);
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.clear-tags-btn:hover {
  background-color: var(--color-accent-light);
}

/* Dialog actions */
.dialog-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.actions-right {
  display: flex;
  gap: var(--spacing-md);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-primary {
  background-color: var(--color-accent);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-accent-hover);
  box-shadow: var(--shadow-hover);
}

.btn-secondary {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.btn-secondary:hover {
  background-color: var(--color-bg-tertiary);
}

.btn-text {
  background: none;
  color: var(--color-text-secondary);
}

.btn-text:hover {
  color: var(--color-text-primary);
  background-color: var(--color-bg-secondary);
}
</style>
