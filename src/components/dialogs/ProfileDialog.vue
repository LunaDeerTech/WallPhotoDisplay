<template>
  <Modal
    v-model="isOpen"
    title="个人信息"
    subtitle="修改您的账号信息"
    size="sm"
    @close="handleClose"
  >
    <div class="profile-content">
      <!-- User info display -->
      <div class="user-info">
        <div class="avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div class="user-details">
          <span class="username">{{ authStore.user?.username }}</span>
          <span class="role-badge" :class="authStore.user?.role">
            {{ authStore.user?.role === 'admin' ? '管理员' : '普通用户' }}
          </span>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'info' }"
          @click="activeTab = 'info'"
        >
          修改信息
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'password' }"
          @click="activeTab = 'password'"
        >
          修改密码
        </button>
      </div>

      <!-- Tab content: Info -->
      <form v-if="activeTab === 'info'" class="form" @submit.prevent="handleUpdateInfo">
        <div class="form-group">
          <label for="display-name" class="form-label">显示名称</label>
          <input
            id="display-name"
            v-model="infoForm.displayName"
            type="text"
            class="form-input"
            placeholder="请输入显示名称"
            :disabled="loading"
          />
          <p class="form-hint">这个名称将显示在您上传的图片上</p>
        </div>

        <Transition name="fade">
          <div v-if="infoError" class="form-error">
            {{ infoError }}
          </div>
        </Transition>

        <Transition name="fade">
          <div v-if="infoSuccess" class="form-success">
            信息更新成功！
          </div>
        </Transition>

        <button
          type="submit"
          class="btn btn-primary btn-block"
          :disabled="loading || !isInfoFormValid"
        >
          {{ loading ? '保存中...' : '保存修改' }}
        </button>
      </form>

      <!-- Tab content: Password -->
      <form v-else class="form" @submit.prevent="handleUpdatePassword">
        <div class="form-group">
          <label for="old-password" class="form-label">当前密码</label>
          <div class="password-input-wrapper">
            <input
              id="old-password"
              v-model="passwordForm.oldPassword"
              :type="showOldPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="请输入当前密码"
              autocomplete="current-password"
              :disabled="loading"
            />
            <button
              type="button"
              class="password-toggle"
              @click="showOldPassword = !showOldPassword"
            >
              <svg v-if="showOldPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label for="new-password" class="form-label">新密码</label>
          <div class="password-input-wrapper">
            <input
              id="new-password"
              v-model="passwordForm.newPassword"
              :type="showNewPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="请输入新密码"
              autocomplete="new-password"
              :disabled="loading"
            />
            <button
              type="button"
              class="password-toggle"
              @click="showNewPassword = !showNewPassword"
            >
              <svg v-if="showNewPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
          <p class="form-hint">密码长度至少 6 个字符</p>
        </div>

        <div class="form-group">
          <label for="confirm-password" class="form-label">确认新密码</label>
          <div class="password-input-wrapper">
            <input
              id="confirm-password"
              v-model="passwordForm.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="请再次输入新密码"
              autocomplete="new-password"
              :disabled="loading"
            />
            <button
              type="button"
              class="password-toggle"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <svg v-if="showConfirmPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
        </div>

        <Transition name="fade">
          <div v-if="passwordError" class="form-error">
            {{ passwordError }}
          </div>
        </Transition>

        <Transition name="fade">
          <div v-if="passwordSuccess" class="form-success">
            密码修改成功！
          </div>
        </Transition>

        <button
          type="submit"
          class="btn btn-primary btn-block"
          :disabled="loading || !isPasswordFormValid"
        >
          {{ loading ? '保存中...' : '修改密码' }}
        </button>
      </form>
    </div>
  </Modal>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue'
import Modal from '../common/Modal.vue'
import { useAuthStore } from '../../stores/auth.js'
import usersApi from '../../api/users.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const authStore = useAuthStore()

// Local state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const activeTab = ref('info')
const loading = ref(false)

// Info form
const infoForm = reactive({
  displayName: ''
})
const infoError = ref('')
const infoSuccess = ref(false)

// Password form
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordError = ref('')
const passwordSuccess = ref(false)
const showOldPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Form validation
const isInfoFormValid = computed(() => {
  return infoForm.displayName.trim() !== ''
})

const isPasswordFormValid = computed(() => {
  return (
    passwordForm.oldPassword.trim() !== '' &&
    passwordForm.newPassword.trim().length >= 6 &&
    passwordForm.confirmPassword === passwordForm.newPassword
  )
})

// Reset form when dialog opens
watch(isOpen, (newValue) => {
  if (newValue) {
    activeTab.value = 'info'
    infoForm.displayName = authStore.user?.displayName || ''
    infoError.value = ''
    infoSuccess.value = false
    
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    passwordError.value = ''
    passwordSuccess.value = false
    showOldPassword.value = false
    showNewPassword.value = false
    showConfirmPassword.value = false
  }
})

// Handle close
function handleClose() {
  isOpen.value = false
}

// Handle update info
async function handleUpdateInfo() {
  if (!isInfoFormValid.value || loading.value) return
  
  loading.value = true
  infoError.value = ''
  infoSuccess.value = false
  
  try {
    const response = await usersApi.update(authStore.user.id, {
      displayName: infoForm.displayName.trim()
    })
    
    if (response.success) {
      authStore.updateUserDisplayName(infoForm.displayName.trim())
      infoSuccess.value = true
      setTimeout(() => { infoSuccess.value = false }, 3000)
    } else {
      infoError.value = response.error || '更新失败'
    }
  } catch (error) {
    infoError.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}

// Handle update password
async function handleUpdatePassword() {
  if (!isPasswordFormValid.value || loading.value) return
  
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = '两次输入的密码不一致'
    return
  }
  
  loading.value = true
  passwordError.value = ''
  passwordSuccess.value = false
  
  try {
    const response = await usersApi.updatePassword(authStore.user.id, {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    
    if (response.success) {
      passwordSuccess.value = true
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
      setTimeout(() => { passwordSuccess.value = false }, 3000)
    } else {
      passwordError.value = response.error || '密码修改失败'
    }
  } catch (error) {
    passwordError.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.profile-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* User info */
.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-round);
  background-color: var(--color-accent-light);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar svg {
  width: 32px;
  height: 32px;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.username {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.role-badge {
  display: inline-flex;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-pill);
  width: fit-content;
}

.role-badge.admin {
  background-color: rgba(255, 149, 0, 0.15);
  color: #FF9500;
}

.role-badge.user {
  background-color: var(--color-accent-light);
  color: var(--color-accent);
}

/* Tabs */
.tabs {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

.tab-btn {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tab-btn:hover {
  color: var(--color-text-primary);
}

.tab-btn.active {
  background-color: var(--color-bg-primary);
  color: var(--color-accent);
  box-shadow: var(--shadow-sm);
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

.password-input-wrapper {
  position: relative;
}

.password-input-wrapper .form-input {
  padding-right: 48px;
}

.password-toggle {
  position: absolute;
  right: var(--spacing-md);
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  color: var(--color-text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--transition-fast);
}

.password-toggle:hover {
  color: var(--color-text-primary);
}

.password-toggle svg {
  width: 20px;
  height: 20px;
}

.form-error {
  padding: var(--spacing-md);
  background-color: rgba(255, 59, 48, 0.1);
  border-radius: var(--radius-md);
  color: var(--color-error);
  font-size: var(--font-size-sm);
}

.form-success {
  padding: var(--spacing-md);
  background-color: rgba(52, 199, 89, 0.1);
  border-radius: var(--radius-md);
  color: var(--color-success);
  font-size: var(--font-size-sm);
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
  box-shadow: var(--shadow-hover);
}

.btn-block {
  width: 100%;
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
