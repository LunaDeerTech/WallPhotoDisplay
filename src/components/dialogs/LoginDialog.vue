<template>
  <Modal
    v-model="isOpen"
    title="登录"
    subtitle="请输入账号和密码"
    size="sm"
    @close="handleClose"
  >
    <form class="login-form" @submit.prevent="handleSubmit">
      <!-- Username input -->
      <div class="form-group">
        <label for="login-username" class="form-label">账号</label>
        <input
          id="login-username"
          v-model="form.username"
          type="text"
          class="form-input"
          placeholder="请输入账号"
          autocomplete="username"
          :disabled="loading"
          required
        />
      </div>

      <!-- Password input -->
      <div class="form-group">
        <label for="login-password" class="form-label">密码</label>
        <div class="password-input-wrapper">
          <input
            id="login-password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            class="form-input"
            placeholder="请输入密码"
            autocomplete="current-password"
            :disabled="loading"
            required
          />
          <button
            type="button"
            class="password-toggle"
            @click="showPassword = !showPassword"
            :aria-label="showPassword ? '隐藏密码' : '显示密码'"
          >
            <svg v-if="showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

      <!-- Error message -->
      <Transition name="fade">
        <div v-if="error" class="form-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{{ error }}</span>
        </div>
      </Transition>
    </form>

    <!-- @vue-ignore -->
    <template #footer>
      <div class="dialog-footer">
        <!-- 左侧辅助操作区 -->
        <div class="footer-left">
          <button
            v-if="allowRegistration"
            type="button"
            class="link-button"
            @click="handleRegister"
            :disabled="loading"
          >
            注册新账号
          </button>
          <button
            type="button"
            class="link-button"
            @click="handleForgotPassword"
            :disabled="loading"
          >
            忘记密码？
          </button>
        </div>

        <!-- 右侧主操作区 -->
        <div class="footer-right">
          <button
            type="button"
            class="btn btn-secondary"
            @click="handleClose"
            :disabled="loading"
          >
            取消
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            @click="handleSubmit"
            :disabled="loading || !isFormValid"
          >
            <span v-if="loading" class="btn-loading">
              <svg class="spinner" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
              </svg>
            </span>
            <span>{{ loading ? '登录中...' : '登录' }}</span>
          </button>
        </div>
      </div>
    </template>
  </Modal>

  <!-- 密码重置对话框 -->
  <ResetPasswordDialog v-model="showResetPassword" />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Modal from '../common/Modal.vue'
import ResetPasswordDialog from './ResetPasswordDialog.vue'
import { useAuthStore } from '@/stores/auth'
import { useConfigStore } from '@/stores/config'

interface Props {
  modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
  'register': []
}>()

const authStore = useAuthStore()
const configStore = useConfigStore()

interface LoginForm {
  username: string
  password: string
}

// Local state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const form = ref<LoginForm>({
  username: '',
  password: ''
})

const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const showResetPassword = ref(false)

// Computed
const allowRegistration = computed(() => {
  return configStore.config?.allowRegistration ?? false
})

// Form validation
const isFormValid = computed(() => {
  return form.value.username.trim() !== '' && form.value.password.trim() !== ''
})

// Reset form when dialog opens
watch(isOpen, (newValue) => {
  if (newValue) {
    form.value = { username: '', password: '' }
    showPassword.value = false
    error.value = ''
  }
})

// Handle close
function handleClose(): void {
  if (!loading.value) {
    isOpen.value = false
  }
}

// Handle register
function handleRegister(): void {
  if (!loading.value) {
    emit('register')
  }
}

// Handle forgot password
function handleForgotPassword(): void {
  if (!loading.value) {
    showResetPassword.value = true
  }
}

// Handle submit
async function handleSubmit(): Promise<void> {
  if (!isFormValid.value || loading.value) return

  loading.value = true
  error.value = ''

  try {
    const result = await authStore.login(form.value.username, form.value.password)
    
    if (result.success) {
      emit('success')
      isOpen.value = false
    } else {
      error.value = result.error || '登录失败，请检查账号和密码'
    }
  } catch (e) {
    error.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-xs) 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.form-input {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-md);
  font-size: var(--font-size-md);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
  transition: all var(--transition-fast);
  font-weight: var(--font-weight-normal);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
  background-color: var(--color-bg-primary);
  box-shadow: 0 0 0 3px var(--color-accent-light);
  transform: translateY(-1px);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.form-input::placeholder {
  color: var(--color-text-placeholder);
  font-weight: var(--font-weight-light);
}

.password-input-wrapper {
  position: relative;
}

.password-input-wrapper .form-input {
  padding-right: 48px;
}

.password-toggle {
  position: absolute;
  right: var(--spacing-sm);
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.password-toggle:hover {
  color: var(--color-accent);
  background-color: rgba(0, 122, 255, 0.1);
  transform: translateY(-50%) scale(1.05);
}

.password-toggle:active {
  transform: translateY(-50%) scale(0.95);
}

.password-toggle svg {
  width: 20px;
  height: 20px;
}

.form-error {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: rgba(255, 59, 48, 0.1);
  border-radius: var(--radius-md);
  color: var(--color-error);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-sm);
}

.form-error svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* Footer Layout */
.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
  width: 100%;
}

.footer-left {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  align-items: flex-start;
}

.footer-right {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

/* Link buttons for footer */
.link-button {
  background: none;
  border: none;
  color: var(--color-accent);
  font-size: var(--font-size-sm);
  cursor: pointer;
  padding: 0;
  text-decoration: none;
  transition: all var(--transition-fast);
  font-weight: var(--font-weight-medium);
  position: relative;
}

.link-button::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 1px;
  background-color: var(--color-accent);
  transition: width var(--transition-fast);
}

.link-button:hover:not(:disabled) {
  color: var(--color-accent-hover);
}

.link-button:hover:not(:disabled)::after {
  width: 100%;
}

.link-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Action buttons */
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  min-width: 80px;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-primary {
  background: linear-gradient(135deg, var(--color-accent), var(--color-accent-hover));
  color: white;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.25);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.35);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
  background-color: var(--color-accent-active);
}

.btn-secondary {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 2px solid var(--color-border);
  font-weight: var(--font-weight-medium);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-bg-tertiary);
  border-color: var(--color-accent);
  color: var(--color-accent);
  transform: translateY(-1px);
}

.btn-secondary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-loading .spinner {
  width: 18px;
  height: 18px;
  animation: spin 1s linear infinite;
}

.btn-loading .spinner circle {
  stroke-dasharray: 60;
  stroke-dashoffset: 45;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

.btn-loading .spinner {
  width: 18px;
  height: 18px;
  animation: spin 1s linear infinite;
}

.btn-loading .spinner circle {
  stroke-dasharray: 60;
  stroke-dashoffset: 45;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-fast);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .dialog-footer {
    flex-direction: column-reverse;
    gap: var(--spacing-sm);
    align-items: stretch;
  }
  
  .footer-left {
    flex-direction: row;
    justify-content: center;
    gap: var(--spacing-md);
    align-items: center;
  }
  
  .footer-right {
    justify-content: stretch;
    width: 100%;
  }
  
  .footer-right .btn {
    flex: 1;
    min-width: 0;
  }
  
  .link-button {
    font-size: var(--font-size-xs);
  }
}
</style>
