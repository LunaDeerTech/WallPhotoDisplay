<template>
  <Modal
    v-model="isOpen"
    title="筛选图片"
    subtitle="通过标签、用户和点赞状态筛选图片"
    size="md"
    @close="handleClose"
  >
    <div class="settings-content">
      <!-- Tag filter -->
      <div class="setting-group">
        <div class="setting-header">
          <label class="setting-label">标签筛选</label>
          <button
            v-if="localTags.length > 0"
            type="button"
            class="clear-tags-btn"
            @click="localTags = []"
          >
            清空
          </button>
        </div>
        <TagSelector
          v-model:selectedTags="localTags"
          mode="all"
          :limit="20"
          :show-search="true"
          :show-count="true"
          :show-selected-summary="true"
          empty-text="暂无可用标签"
        />
      </div>

      <!-- User filter -->
      <div class="setting-group">
        <div class="setting-header">
          <label class="setting-label">用户筛选</label>
          <button
            v-if="localUsers.length > 0"
            type="button"
            class="clear-tags-btn"
            @click="localUsers = []"
          >
            清空
          </button>
        </div>

        <!-- User Search -->
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            v-model="userSearchKeyword"
            type="text"
            class="search-input"
            placeholder="搜索用户..."
          />
        </div>

        <div class="user-list" v-if="users.length > 0">
          <div 
            v-for="user in displayedUsers" 
            :key="user.id"
            class="user-item"
            :class="{ active: localUsers.includes(user.id) }"
            @click="toggleUser(user.id)"
          >
            <span class="user-name">{{ user.displayName || user.username }}</span>
            <span class="check-icon" v-if="localUsers.includes(user.id)">✓</span>
          </div>
          <div v-if="displayedUsers.length === 0 && userSearchKeyword" class="no-results">
            未找到匹配用户
          </div>
          <div v-if="displayedUsers.length === 0 && !userSearchKeyword" class="no-results">
            请输入用户名进行搜索
          </div>
        </div>
        <div v-else class="loading-text">加载用户中...</div>

        <!-- Selected Users Summary -->
        <div v-if="localUsers.length > 0" class="selected-summary">
          <span class="summary-label">已选择:</span>
          <div class="summary-tags">
            <span
              v-for="user in selectedUserObjects"
              :key="user.id"
              class="summary-tag"
              @click="toggleUser(user.id)"
            >
              {{ user.displayName || user.username }}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          </div>
        </div>
      </div>

      <!-- Liked filter -->
      <div class="setting-group">
        <div class="setting-header">
          <label class="setting-label">点赞筛选</label>
        </div>
        <button
          type="button"
          class="liked-filter-btn"
          :class="{ active: localLikedByMe }"
          @click="localLikedByMe = !localLikedByMe"
        >
          <div class="liked-filter-content">
            <div class="liked-icon-wrapper">
              <svg 
                class="liked-icon" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <div class="liked-text-content">
              <span class="liked-label">只看我赞过的图片</span>
              <span class="liked-description">仅显示您点赞过的图片</span>
            </div>
            <div class="liked-checkmark" v-if="localLikedByMe">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </button>
      </div>
    </div>

    <template #footer>
      <div class="dialog-actions">
        <button
          type="button"
          class="btn btn-text"
          @click="resetToDefaults"
        >
          重置
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
            应用
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import Modal from '../common/Modal.vue'
import TagSelector from '../common/TagSelector.vue'
import { useSettingsStore } from '@/stores/settings'
import usersApi from '@/api/users'
import type { User } from '@/types'

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

// Local state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const localTags = ref<string[]>([])
const localUsers = ref<number[]>([])
const localLikedByMe = ref<boolean>(false)
const users = ref<User[]>([])
const userSearchKeyword = ref('')

// Fetch users
async function fetchUsers() {
  try {
    const res = await usersApi.getAll()
    if (res.success && res.data) {
      users.value = res.data
    }
  } catch (e) {
    console.error('Failed to fetch users:', e)
  }
}

// Displayed users based on search
const displayedUsers = computed(() => {
  if (!userSearchKeyword.value) {
    return []
  }
  const keyword = userSearchKeyword.value.toLowerCase()
  return users.value.filter(u => 
    (u.displayName || u.username).toLowerCase().includes(keyword)
  )
})

// Get selected user objects for summary
const selectedUserObjects = computed(() => {
  return users.value.filter(u => localUsers.value.includes(u.id))
})

// Toggle user
function toggleUser(id: number) {
  const index = localUsers.value.indexOf(id)
  if (index === -1) {
    localUsers.value.push(id)
  } else {
    localUsers.value.splice(index, 1)
  }
}

// Sync local settings when dialog opens
watch(isOpen, (newValue) => {
  if (newValue) {
    localTags.value = [...settingsStore.selectedTags]
    localUsers.value = [...(settingsStore.selectedUsers || [])]
    localLikedByMe.value = settingsStore.likedByMe || false
    if (users.value.length === 0) {
      fetchUsers()
    }
  }
})

// Handle close
function handleClose(): void {
  isOpen.value = false
}

// Handle save
function handleSave(): void {
  settingsStore.setSelectedTags(localTags.value)
  settingsStore.setSelectedUsers(localUsers.value)
  settingsStore.setLikedByMe(localLikedByMe.value)
  isOpen.value = false
}

// Reset to defaults
function resetToDefaults(): void {
  localTags.value = []
  localUsers.value = []
  localLikedByMe.value = false
  userSearchKeyword.value = ''
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

.clear-tags-btn {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.clear-tags-btn:hover {
  color: var(--color-danger);
}

.dialog-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.actions-right {
  display: flex;
  gap: var(--spacing-md);
}

.btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: none;
}

.btn-text {
  background: none;
  color: var(--color-text-secondary);
  padding-left: 0;
}

.btn-text:hover {
  color: var(--color-text-primary);
}

.btn-secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.btn-secondary:hover {
  background: var(--color-bg-tertiary);
}

.btn-primary {
  background: var(--color-accent);
  color: white;
}

.btn-primary:hover {
  filter: brightness(1.1);
}

.user-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--spacing-sm);
}

.user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 1px solid transparent;
}

.user-item:hover {
  background: var(--color-bg-tertiary);
}

.user-item.active {
  background: var(--color-accent-light);
  color: var(--color-accent);
  border-color: var(--color-accent);
}

.user-name {
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.check-icon {
  font-size: 0.8rem;
  font-weight: bold;
}

.loading-text {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  padding: var(--spacing-sm);
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: var(--spacing-sm);
  width: 16px;
  height: 16px;
  color: var(--color-text-secondary);
}

.search-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  padding-left: calc(var(--spacing-sm) * 2 + 16px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  transition: border-color var(--transition-fast);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.no-results {
  padding: var(--spacing-md);
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  grid-column: 1 / -1;
}

.selected-summary {
  margin-top: var(--spacing-sm);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--color-border-light);
}

.summary-label {
  display: block;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.summary-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.summary-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: var(--color-accent-light);
  color: var(--color-accent);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.summary-tag:hover {
  background: var(--color-bg-danger-light);
  color: var(--color-danger);
}

.summary-tag svg {
  width: 12px;
  height: 12px;
}

.liked-filter-btn {
  width: 100%;
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
  position: relative;
}

.liked-filter-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-accent);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.liked-filter-btn.active {
  background: var(--color-accent-light);
  border-color: var(--color-accent);
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.15);
}

.liked-filter-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.liked-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--color-bg-primary);
  border-radius: var(--radius-md);
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.liked-filter-btn.active .liked-icon-wrapper {
  background: var(--color-accent);
}

.liked-icon {
  width: 20px;
  height: 20px;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.liked-filter-btn.active .liked-icon {
  color: white;
}

.liked-text-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.liked-label {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.liked-description {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  line-height: 1.2;
}

.liked-filter-btn.active .liked-label {
  color: var(--color-accent);
  font-weight: 600;
}

.liked-filter-btn.active .liked-description {
  color: var(--color-accent);
  opacity: 0.8;
}

.liked-checkmark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--color-accent);
  border-radius: var(--radius-round);
  flex-shrink: 0;
  animation: checkmark-pop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.liked-checkmark svg {
  width: 14px;
  height: 14px;
  color: white;
}

@keyframes checkmark-pop {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
