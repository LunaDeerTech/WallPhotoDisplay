<template>
  <div class="login-container">
    <div class="login-header" v-if="showHeader">
      <h2 class="login-title">登录</h2>
      <p class="login-subtitle">请输入账号和密码</p>
    </div>

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
        <div class="form-label-row">
          <label for="login-password" class="form-label">密码</label>
          <button
            v-if="showForgotPassword"
            type="button"
            class="btn-link btn-link-sm"
            @click="$emit('forgot-password')"
            :disabled="loading"
            tabindex="-1"
          >
            忘记密码？
          </button>
        </div>
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
            tabindex="-1"
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

      <!-- Actions -->
      <div class="form-actions">
        <button
          type="submit"
          class="btn btn-primary btn-block"
          :disabled="loading || !isFormValid"
        >
          <span v-if="loading" class="btn-loading">
            <svg class="spinner" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
            </svg>
          </span>
          <span>{{ loading ? '登录中...' : '登录' }}</span>
        </button>
        
        <button
          v-if="showCancel"
          type="button"
          class="btn btn-secondary btn-block"
          @click="$emit('cancel')"
          :disabled="loading"
        >
          取消
        </button>
      </div>

      <!-- Footer / Registration -->
      <div class="form-footer" v-if="shouldShowRegistration">
        <span class="footer-text">还没有账号？</span>
        <button
          type="button"
          class="btn-link"
          @click="$emit('register')"
          :disabled="loading"
        >
          注册新账号
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useConfigStore } from '@/stores/config'

interface Props {
  showHeader?: boolean
  showCancel?: boolean
  allowRegistration?: boolean
  showForgotPassword?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showHeader: false,
  showCancel: false,
  allowRegistration: undefined,
  showForgotPassword: false
})

const configStore = useConfigStore()

// Use prop if provided, otherwise fall back to config
const shouldShowRegistration = computed(() => {
  return props.allowRegistration ?? configStore.config?.allowRegistration ?? false
})

const emit = defineEmits<{
  'success': [],
  'cancel': [],
  'register': [],
  'forgot-password': []
}>()

const authStore = useAuthStore()

interface LoginForm {
  username: string
  password: string
}

const form = ref<LoginForm>({
  username: '',
  password: ''
})

const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

// Form validation
const isFormValid = computed(() => {
  return form.value.username.trim() !== '' && form.value.password.trim() !== ''
})

// Expose loading state to parent components
defineExpose({
  loading: computed(() => loading.value),
  handleSubmit,
  resetForm: () => {
    form.value = { username: '', password: '' }
    showPassword.value = false
    error.value = ''
  }
})

// Auto-reset when component mounts (for dialog reuse)
watch(() => props.showHeader, () => {
  if (props.showHeader) {
    resetForm()
  }
}, { immediate: true })

// Reset function
function resetForm(): void {
  form.value = { username: '', password: '' }
  showPassword.value = false
  error.value = ''
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
.login-container {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-lg);
}

.login-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.login-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-sm);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.form-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
}

.form-input:hover:not(:focus) {
  border-color: var(--color-accent);
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
  background-color: var(--color-accent-light);
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
  border-left: 3px solid var(--color-error);
}

.form-error svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.form-footer {
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-lg);
  font-size: var(--font-size-md);
}

.footer-text {
  color: var(--color-text-secondary);
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

.btn-block {
  width: 100%;
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

.btn-link {
  background: none;
  border: none;
  color: var(--color-accent);
  cursor: pointer;
  padding: 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  transition: color var(--transition-fast);
  font-family: inherit;
}

.btn-link:hover:not(:disabled) {
  color: var(--color-accent-hover);
  text-decoration: underline;
}

.btn-link-sm {
  font-size: var(--font-size-sm);
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
</style>
