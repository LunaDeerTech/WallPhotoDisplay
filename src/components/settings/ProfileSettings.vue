<template>
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
        <div class="badges">
          <span class="role-badge" :class="authStore.user?.role">
            {{ authStore.user?.role === 'admin' ? '管理员' : '普通用户' }}
          </span>
          <span class="role-badge email-badge" :class="{ verified: authStore.user?.emailVerified }">
            {{ authStore.user?.email ? (authStore.user?.emailVerified ? '邮箱已验证' : '邮箱未验证') : '未绑定邮箱' }}
          </span>
        </div>
      </div>
    </div>

    <div class="settings-container">
      <!-- Section: Info -->
      <section class="settings-section">
        <h4 class="sub-section-title">修改信息</h4>
        <form class="form" @submit.prevent="handleUpdateInfo">
          <div class="form-group">
            <label for="display-name" class="form-label">显示名称</label>
            <div class="input-with-button">
              <input
                id="display-name"
                v-model="infoForm.displayName"
                type="text"
                class="form-input"
                placeholder="请输入显示名称"
                :disabled="loading"
              />
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="loading || !isInfoFormValid"
              >
                {{ loading ? '保存中...' : '保存' }}
              </button>
            </div>
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
        </form>
      </section>

      <!-- Section: Email -->
      <section class="settings-section">
        <h4 class="sub-section-title">修改邮箱</h4>
        <div class="form">
          <div class="form-group">
            <label class="form-label">当前邮箱</label>
            <div class="current-email-row">
              <div class="current-email">
                {{ authStore.user?.email || '未绑定' }}
                <span v-if="authStore.user?.email" class="status-text" :class="{ verified: authStore.user?.emailVerified }">
                  ({{ authStore.user?.emailVerified ? '已验证' : '未验证' }})
                </span>
              </div>
              <button
                type="button"
                class="btn btn-secondary"
                @click="showEmailDialog = true"
              >
                {{ authStore.user?.email ? '更换邮箱' : '绑定邮箱' }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Section: Password -->
      <section class="settings-section">
        <h4 class="sub-section-title">修改密码</h4>
        <form class="form" @submit.prevent="handleUpdatePassword">
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
            <p class="form-hint">密码长度至少 6 位</p>
          </div>

          <div class="form-group">
            <label for="confirm-password" class="form-label">确认新密码</label>
            <input
              id="confirm-password"
              v-model="passwordForm.confirmPassword"
              type="password"
              class="form-input"
              placeholder="请再次输入新密码"
              autocomplete="new-password"
              :disabled="loading"
            />
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

          <div class="form-actions">
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="loading || !isPasswordFormValid"
            >
              {{ loading ? '保存中...' : '修改密码' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </div>


  <EmailVerificationDialog
    v-model="showEmailDialog"
    :title="authStore.user?.email ? '更换邮箱' : '绑定邮箱'"
    :subtitle="authStore.user?.email ? '验证新邮箱以更换绑定' : '验证邮箱以完成绑定'"
    :cancellable="true"
    @success="handleEmailSuccess"
  />
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import usersApi from '@/api/users'
import EmailVerificationDialog from '@/components/dialogs/EmailVerificationDialog.vue'

const authStore = useAuthStore()

// Email Dialog
const showEmailDialog = ref(false)

function handleEmailSuccess() {
  // Refresh user info is handled inside dialog, but we can do extra things here if needed
}

// Info form
const infoForm = reactive({
  displayName: ''
})

const infoError = ref('')
const infoSuccess = ref(false)

const isInfoFormValid = computed(() => {
  return infoForm.displayName.trim().length > 0 && 
         infoForm.displayName !== authStore.user?.displayName
})

// Password form
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const showOldPassword = ref(false)
const showNewPassword = ref(false)
const passwordError = ref('')
const passwordSuccess = ref(false)

const isPasswordFormValid = computed(() => {
  return passwordForm.oldPassword.length > 0 &&
         passwordForm.newPassword.length >= 6 &&
         passwordForm.newPassword === passwordForm.confirmPassword
})

const loading = ref(false)

// Initialize
onMounted(() => {
  if (authStore.user) {
    infoForm.displayName = authStore.user.displayName || ''
  }
})

// Actions
async function handleUpdateInfo() {
  if (!isInfoFormValid.value || !authStore.user) return
  
  loading.value = true
  infoError.value = ''
  infoSuccess.value = false
  
  try {
    await usersApi.update(authStore.user.id, {
      displayName: infoForm.displayName
    })
    
    // Update store
    await authStore.fetchCurrentUser()
    
    infoSuccess.value = true
    setTimeout(() => {
      infoSuccess.value = false
    }, 3000)
  } catch (err: any) {
    infoError.value = err.response?.data?.error || '更新失败，请重试'
  } finally {
    loading.value = false
  }
}

async function handleUpdatePassword() {
  if (!isPasswordFormValid.value || !authStore.user) return
  
  loading.value = true
  passwordError.value = ''
  passwordSuccess.value = false
  
  try {
    await usersApi.updatePassword(authStore.user.id, {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    
    passwordSuccess.value = true
    
    // Reset form
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    
    setTimeout(() => {
      passwordSuccess.value = false
    }, 3000)
  } catch (err: any) {
    passwordError.value = err.response?.data?.error || '修改失败，请重试'
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
  padding: var(--spacing-md);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}

.badges {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.username {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.role-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}

.role-badge.admin {
  background: var(--color-accent-light);
  color: var(--color-accent);
}

.role-badge.email-badge {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}

.role-badge.email-badge.verified {
  background: #dcfce7;
  color: #166534;
}

/* Settings Layout */
.settings-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.sub-section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
  padding-bottom: var(--spacing-xs);
  border-bottom: 1px solid var(--color-border);
}

/* Form */
.form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.form-input {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 1rem;
  transition: border-color var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.form-input:disabled {
  background: var(--color-bg-secondary);
  cursor: not-allowed;
}

.form-hint {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.input-with-button {
  display: flex;
  gap: var(--spacing-sm);
}

.input-with-button .form-input {
  flex: 1;
}

.current-email-row {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.current-email {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.status-text {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.status-text.verified {
  color: var(--color-success);
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrapper .form-input {
  width: 100%;
  padding-right: 40px;
}

.password-toggle {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.password-toggle:hover {
  color: var(--color-text-primary);
}

.password-toggle svg {
  width: 20px;
  height: 20px;
}

.form-error {
  padding: var(--spacing-sm);
  background: #fee2e2;
  color: #ef4444;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
}

.form-success {
  padding: var(--spacing-sm);
  background: #dcfce7;
  color: #22c55e;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--spacing-sm);
}

.btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-primary {
  background: var(--color-accent);
  color: white;
}

.btn-primary:hover {
  filter: brightness(1.1);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-bg-elevated);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
