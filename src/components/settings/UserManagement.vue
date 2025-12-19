<template>
  <div class="user-manage-content">
    <!-- Toolbar -->
    <div class="toolbar">
      <button
        type="button"
        class="toolbar-btn primary"
        @click="showAddUser = true"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="8.5" cy="7" r="4"/>
          <line x1="20" y1="8" x2="20" y2="14"/>
          <line x1="23" y1="11" x2="17" y2="11"/>
        </svg>
        <span>添加用户</span>
      </button>
      
      <div class="toolbar-spacer" />
      
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索用户..."
          class="search-input"
        />
      </div>
    </div>

    <!-- Users list -->
    <div class="users-container">
      <div v-if="loading" class="loading-state">
        <svg class="spinner" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3"/>
        </svg>
        <span>加载中...</span>
      </div>

      <div v-else-if="filteredUsers.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <p>{{ searchKeyword ? '未找到匹配的用户' : '暂无用户' }}</p>
      </div>

      <div v-else class="users-list">
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          class="user-item"
        >
          <div class="user-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          
          <div class="user-info">
            <div class="user-name-row">
              <span class="user-display-name">{{ user.displayName || user.username }}</span>
              <span class="role-badge" :class="user.role">
                {{ user.role === 'admin' ? '管理员' : '用户' }}
              </span>
              <span v-if="user.isBanned" class="banned-badge">
                已封禁
              </span>
            </div>
            <span class="user-username">@{{ user.username }}</span>
          </div>
          
          <div class="user-actions">
            <!-- Ban/Unban button -->
            <button
              v-if="user.id !== authStore.user?.id"
              type="button"
              class="action-btn"
              :class="user.isBanned ? 'success' : 'warning'"
              :title="user.isBanned ? '解封用户' : '封禁用户'"
              @click="handleBanToggle(user)"
            >
              <svg v-if="user.isBanned" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="9"/>
                <path d="M4.93 4.93l14.14 14.14"/>
              </svg>
            </button>
            
            <button
              type="button"
              class="action-btn"
              title="修改密码"
              @click="handleResetPassword(user)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </button>
            <button
              v-if="user.id !== authStore.user?.id"
              type="button"
              class="action-btn danger"
              title="删除用户"
              @click="handleDeleteUser(user)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add user dialog -->
    <Modal
      v-model="showAddUser"
      title="添加用户"
      size="sm"
    >
      <form class="form" @submit.prevent="handleAddUser">
        <div class="form-group">
          <label for="new-username" class="form-label">账号 <span class="required">*</span></label>
          <input
            id="new-username"
            v-model="addUserForm.username"
            type="text"
            class="form-input"
            placeholder="请输入账号（登录用）"
            :disabled="addUserLoading"
            required
          />
          <p class="form-hint">账号创建后不可修改</p>
        </div>

        <div class="form-group">
          <label for="new-display-name" class="form-label">显示名称</label>
          <input
            id="new-display-name"
            v-model="addUserForm.displayName"
            type="text"
            class="form-input"
            placeholder="请输入显示名称（可选）"
            :disabled="addUserLoading"
          />
        </div>

        <div class="form-group">
          <label for="new-password" class="form-label">密码 <span class="required">*</span></label>
          <input
            id="new-password"
            v-model="addUserForm.password"
            type="password"
            class="form-input"
            placeholder="请输入密码"
            :disabled="addUserLoading"
            required
          />
        </div>

        <div class="form-group">
          <label for="new-role" class="form-label">角色</label>
          <select
            id="new-role"
            v-model="addUserForm.role"
            class="form-input"
            :disabled="addUserLoading"
          >
            <option value="user">普通用户</option>
            <option value="admin">管理员</option>
          </select>
        </div>

        <Transition name="fade">
          <div v-if="addUserError" class="form-error">
            {{ addUserError }}
          </div>
        </Transition>
      </form>

      <!-- @vue-ignore -->
      <template #footer>
        <div class="dialog-actions">
          <button
            type="button"
            class="btn btn-secondary"
            @click="showAddUser = false"
            :disabled="addUserLoading"
          >
            取消
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="handleAddUser"
            :disabled="addUserLoading || !isAddUserFormValid"
          >
            {{ addUserLoading ? '添加中...' : '添加' }}
          </button>
        </div>
      </template>
    </Modal>

    <!-- Reset password dialog -->
    <Modal
      v-model="showResetPassword"
      title="修改密码"
      :subtitle="resetPasswordUser?.username"
      size="sm"
    >
      <form class="form" @submit.prevent="confirmResetPassword">
        <div class="form-group">
          <label for="reset-password" class="form-label">新密码</label>
          <input
            id="reset-password"
            v-model="resetPasswordForm.newPassword"
            type="password"
            class="form-input"
            placeholder="请输入新密码"
            :disabled="resetPasswordLoading"
            required
          />
          <p class="form-hint">密码长度至少 6 个字符</p>
        </div>

        <Transition name="fade">
          <div v-if="resetPasswordError" class="form-error">
            {{ resetPasswordError }}
          </div>
        </Transition>
      </form>

      <!-- @vue-ignore -->
      <template #footer>
        <div class="dialog-actions">
          <button
            type="button"
            class="btn btn-secondary"
            @click="showResetPassword = false"
            :disabled="resetPasswordLoading"
          >
            取消
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="confirmResetPassword"
            :disabled="resetPasswordLoading || resetPasswordForm.newPassword.length < 6"
          >
            {{ resetPasswordLoading ? '保存中...' : '确定' }}
          </button>
        </div>
      </template>
    </Modal>

    <!-- Delete user confirmation -->
    <Modal
      v-model="showDeleteConfirm"
      title="确认删除"
      size="sm"
    >
      <p class="confirm-message">
        确定要删除用户 <strong>{{ deleteTargetUser?.displayName || deleteTargetUser?.username }}</strong> 吗？<br />
        该用户上传的所有图片也将被删除，此操作不可撤销。
      </p>
      <!-- @vue-ignore -->
      <template #footer>
        <div class="dialog-actions">
          <button type="button" class="btn btn-secondary" @click="showDeleteConfirm = false">
            取消
          </button>
          <button
            type="button"
            class="btn btn-danger"
            @click="confirmDeleteUser"
            :disabled="deleteLoading"
          >
            {{ deleteLoading ? '删除中...' : '删除' }}
          </button>
        </div>
      </template>
    </Modal>

    <!-- Ban/Unban user dialog -->
    <Modal
      v-model="showBanConfirm"
      :title="banTargetUser?.isBanned ? '解封用户' : '封禁用户'"
      size="sm"
    >
      <div v-if="banTargetUser?.isBanned" class="confirm-message">
        确定要解封用户 <strong>{{ banTargetUser?.displayName || banTargetUser?.username }}</strong> 吗？<br />
        解封后用户可以正常登录和访问系统。
      </div>
      <div v-else class="ban-form">
        <p class="confirm-message">
          确定要封禁用户 <strong>{{ banTargetUser?.displayName || banTargetUser?.username }}</strong> 吗？<br />
          封禁后用户将无法登录，且所有上传的图片都将不可见。
        </p>
        <div class="form-group" style="margin-top: var(--spacing-md);">
          <label for="ban-reason" class="form-label">封禁理由 <span class="required">*</span></label>
          <textarea
            id="ban-reason"
            v-model="banReason"
            class="form-input"
            placeholder="请输入封禁理由（必填）"
            :disabled="banLoading"
            rows="3"
            maxlength="500"
          />
          <p class="form-hint">封禁理由将对管理员可见，用户登录时也会看到</p>
        </div>
      </div>
      
      <!-- @vue-ignore -->
      <template #footer>
        <div class="dialog-actions">
          <button type="button" class="btn btn-secondary" @click="showBanConfirm = false" :disabled="banLoading">
            取消
          </button>
          <button
            v-if="banTargetUser?.isBanned"
            type="button"
            class="btn btn-primary"
            @click="confirmBanUser"
            :disabled="banLoading"
          >
            {{ banLoading ? '解封中...' : '解封' }}
          </button>
          <button
            v-else
            type="button"
            class="btn btn-danger"
            @click="confirmBanUser"
            :disabled="banLoading || !banReason.trim()"
          >
            {{ banLoading ? '封禁中...' : '封禁' }}
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onMounted } from 'vue'
import Modal from '../common/Modal.vue'
import { useAuthStore } from '@/stores/auth'
import usersApi from '@/api/users'
import type { User } from '@/types'

const authStore = useAuthStore()

type UserRole = 'admin' | 'user'

interface AddUserForm {
  username: string
  displayName: string
  password: string
  role: UserRole
}

interface ResetPasswordForm {
  newPassword: string
}

const users = ref<User[]>([])
const loading = ref(false)
const searchKeyword = ref('')

// Add user state
const showAddUser = ref(false)
const addUserLoading = ref(false)
const addUserError = ref('')
const addUserForm = reactive<AddUserForm>({
  username: '',
  displayName: '',
  password: '',
  role: 'user'
})

// Reset password state
const showResetPassword = ref(false)
const resetPasswordLoading = ref(false)
const resetPasswordError = ref('')
const resetPasswordUser = ref<User | null>(null)
const resetPasswordForm = reactive<ResetPasswordForm>({
  newPassword: ''
})

// Delete user state
const showDeleteConfirm = ref(false)
const deleteLoading = ref(false)
const deleteTargetUser = ref<User | null>(null)

// Ban/Unban user state
const showBanConfirm = ref(false)
const banLoading = ref(false)
const banTargetUser = ref<User | null>(null)
const banReason = ref('')

// Computed
const filteredUsers = computed(() => {
  if (!searchKeyword.value) return users.value
  
  const keyword = searchKeyword.value.toLowerCase()
  return users.value.filter(user =>
    user.username.toLowerCase().includes(keyword) ||
    (user.displayName && user.displayName.toLowerCase().includes(keyword))
  )
})

const isAddUserFormValid = computed(() => {
  return (
    addUserForm.username.trim() !== '' &&
    addUserForm.password.trim().length >= 6
  )
})

// Reset add user form when dialog closes
watch(showAddUser, (newValue) => {
  if (!newValue) {
    addUserForm.username = ''
    addUserForm.displayName = ''
    addUserForm.password = ''
    addUserForm.role = 'user'
    addUserError.value = ''
  }
})

// Reset password form when dialog closes
watch(showResetPassword, (newValue) => {
  if (!newValue) {
    resetPasswordForm.newPassword = ''
    resetPasswordError.value = ''
    resetPasswordUser.value = null
  }
})

// Fetch users
async function fetchUsers(): Promise<void> {
  loading.value = true
  
  try {
    const response = await usersApi.getAll()
    
    if (response.success && response.data) {
      users.value = response.data
    }
  } catch (error) {
    console.error('Fetch users error:', error)
  } finally {
    loading.value = false
  }
}

// Handle add user
async function handleAddUser(): Promise<void> {
  if (!isAddUserFormValid.value || addUserLoading.value) return
  
  addUserLoading.value = true
  addUserError.value = ''
  
  try {
    const response = await usersApi.create({
      username: addUserForm.username.trim(),
      displayName: addUserForm.displayName.trim() || undefined,
      password: addUserForm.password,
      role: addUserForm.role
    })
    
    if (response.success) {
      showAddUser.value = false
      await fetchUsers()
    } else {
      addUserError.value = response.error || '添加用户失败'
    }
  } catch (error) {
    addUserError.value = '网络错误，请稍后重试'
  } finally {
    addUserLoading.value = false
  }
}

// Handle reset password
function handleResetPassword(user: User): void {
  resetPasswordUser.value = user
  showResetPassword.value = true
}

async function confirmResetPassword(): Promise<void> {
  if (resetPasswordForm.newPassword.length < 6 || resetPasswordLoading.value || !resetPasswordUser.value) return
  
  resetPasswordLoading.value = true
  resetPasswordError.value = ''
  
  try {
    const response = await usersApi.updatePassword(resetPasswordUser.value.id, {
      newPassword: resetPasswordForm.newPassword
    })
    
    if (response.success) {
      showResetPassword.value = false
    } else {
      resetPasswordError.value = response.error || '修改密码失败'
    }
  } catch (error) {
    resetPasswordError.value = '网络错误，请稍后重试'
  } finally {
    resetPasswordLoading.value = false
  }
}

// Handle delete user
function handleDeleteUser(user: User): void {
  deleteTargetUser.value = user
  showDeleteConfirm.value = true
}

async function confirmDeleteUser(): Promise<void> {
  if (!deleteTargetUser.value || deleteLoading.value) return
  
  deleteLoading.value = true
  
  try {
    const response = await usersApi.delete(deleteTargetUser.value.id)
    
    if (response.success) {
      showDeleteConfirm.value = false
      deleteTargetUser.value = null
      await fetchUsers()
    }
  } catch (error) {
    console.error('Delete user error:', error)
  } finally {
    deleteLoading.value = false
  }
}

// Handle ban/unban user
function handleBanToggle(user: User): void {
  banTargetUser.value = user
  banReason.value = ''
  showBanConfirm.value = true
}

async function confirmBanUser(): Promise<void> {
  if (!banTargetUser.value || banLoading.value) return
  
  // 封禁需要理由
  if (!banTargetUser.value.isBanned && !banReason.value.trim()) {
    return
  }
  
  banLoading.value = true
  
  try {
    let response
    if (banTargetUser.value.isBanned) {
      // 解封
      response = await usersApi.unban(banTargetUser.value.id)
    } else {
      // 封禁
      response = await usersApi.ban(banTargetUser.value.id, banReason.value.trim())
    }
    
    if (response.success) {
      showBanConfirm.value = false
      banTargetUser.value = null
      banReason.value = ''
      await fetchUsers()
    }
  } catch (error) {
    console.error('Ban/Unban user error:', error)
  } finally {
    banLoading.value = false
  }
}

// Reset ban form when dialog closes
watch(showBanConfirm, (newValue) => {
  if (!newValue) {
    banReason.value = ''
    banTargetUser.value = null
  }
})

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.user-manage-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 300px;
}

/* Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toolbar-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.toolbar-btn.primary {
  background-color: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
}

.toolbar-btn.primary:hover {
  background-color: var(--color-accent-hover);
  border-color: var(--color-accent-hover);
}

.toolbar-btn svg {
  width: 18px;
  height: 18px;
}

.toolbar-spacer {
  flex: 1;
}

.search-box {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  transition: all var(--transition-fast);
}

.search-box:focus-within {
  border-color: var(--color-accent);
  background-color: var(--color-bg-primary);
}

.search-box svg {
  width: 18px;
  height: 18px;
  color: var(--color-text-muted);
}

.search-input {
  border: none;
  background: none;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  outline: none;
  width: 200px;
}

.search-input::placeholder {
  color: var(--color-text-placeholder);
}

/* Users container */
.users-container {
  flex: 1;
  overflow-y: auto;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.user-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.user-item:hover {
  background-color: var(--color-bg-tertiary);
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-round);
  background-color: var(--color-accent-light);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-avatar svg {
  width: 28px;
  height: 28px;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.user-display-name {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.user-username {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.role-badge {
  display: inline-flex;
  padding: 2px var(--spacing-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-pill);
}

.role-badge.admin {
  background-color: rgba(255, 149, 0, 0.15);
  color: #FF9500;
}

.role-badge.user {
  background-color: var(--color-accent-light);
  color: var(--color-accent);
}

.banned-badge {
  display: inline-flex;
  padding: 2px var(--spacing-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-pill);
  background-color: rgba(255, 59, 48, 0.15);
  color: var(--color-error);
}

.user-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.action-btn.danger:hover {
  border-color: var(--color-error);
  color: var(--color-error);
}

.action-btn.warning:hover {
  border-color: var(--color-warning);
  color: var(--color-warning);
}

.action-btn.success:hover {
  border-color: var(--color-success);
  color: var(--color-success);
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

/* Loading / Empty states */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  height: 100%;
  color: var(--color-text-secondary);
}

.loading-state svg,
.empty-state svg {
  width: 64px;
  height: 64px;
  opacity: 0.5;
}

.spinner {
  animation: spin 1s linear infinite;
}

.spinner circle {
  stroke-dasharray: 60;
  stroke-dashoffset: 45;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

/* Form */
.form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.form-label .required {
  color: var(--color-error);
}

.form-input {
  width: 100%;
  padding: var(--spacing-md);
  font-size: var(--font-size-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
  transition: all var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
  background-color: var(--color-bg-primary);
  box-shadow: 0 0 0 3px var(--color-accent-light);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-input::placeholder {
  color: var(--color-text-placeholder);
}

.form-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.form-error {
  padding: var(--spacing-md);
  background-color: rgba(255, 59, 48, 0.1);
  border-radius: var(--radius-md);
  color: var(--color-error);
  font-size: var(--font-size-sm);
}

/* Confirm dialog */
.confirm-message {
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
  line-height: var(--line-height-normal);
}

.confirm-message strong {
  color: var(--color-accent);
}

/* Dialog actions */
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--color-accent);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-accent-hover);
}

.btn-secondary {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-bg-tertiary);
}

.btn-danger {
  background-color: var(--color-error);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #cc2929;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-fast);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
