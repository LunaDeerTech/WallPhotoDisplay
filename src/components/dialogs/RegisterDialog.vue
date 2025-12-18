<template>
  <Modal
    v-model="isOpen"
    title="注册"
    subtitle="创建新账号"
    size="sm"
    @close="handleClose"
  >
    <form class="register-form" @submit.prevent="handleSubmit">
      <!-- Username input -->
      <div class="form-group">
        <label for="register-username" class="form-label">用户名</label>
        <input
          id="register-username"
          v-model="form.username"
          type="text"
          class="form-input"
          placeholder="请输入用户名"
          autocomplete="username"
          :disabled="loading"
          required
          maxlength="20"
        />
        <span class="help-text">4-20个字符，字母、数字、下划线</span>
      </div>

      <!-- Password input -->
      <div class="form-group">
        <label for="register-password" class="form-label">密码</label>
        <div class="password-input-wrapper">
          <input
            id="register-password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            class="form-input"
            placeholder="请输入密码"
            autocomplete="new-password"
            :disabled="loading"
            required
            minlength="6"
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
        <span class="help-text">至少6个字符</span>
      </div>

      <!-- Confirm password input -->
      <div class="form-group">
        <label for="register-confirm-password" class="form-label">确认密码</label>
        <div class="password-input-wrapper">
          <input
            id="register-confirm-password"
            v-model="form.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            class="form-input"
            placeholder="请再次输入密码"
            autocomplete="new-password"
            :disabled="loading"
            required
          />
          <button
            type="button"
            class="password-toggle"
            @click="showConfirmPassword = !showConfirmPassword"
            :aria-label="showConfirmPassword ? '隐藏密码' : '显示密码'"
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

      <!-- Success message -->
      <Transition name="fade">
        <div v-if="success" class="form-success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span>{{ success }}</span>
        </div>
      </Transition>
    </form>

    <!-- @vue-ignore -->
    <template #footer>
      <div class="dialog-actions">
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
          <span>{{ loading ? '注册中...' : '注册' }}</span>
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Modal from '../common/Modal.vue'
import { useAuthStore } from '@/stores/auth'

interface Props {
  modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
}>()

const authStore = useAuthStore()

interface RegisterForm {
  username: string
  password: string
  confirmPassword: string
}

// Local state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const form = ref<RegisterForm>({
  username: '',
  password: '',
  confirmPassword: ''
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref('')

// Form validation
const isFormValid = computed(() => {
  const usernameValid = form.value.username.trim().length >= 4 && 
                       form.value.username.trim().length <= 20 &&
                       /^[\w]+$/.test(form.value.username.trim())
  const passwordValid = form.value.password.length >= 6
  const passwordsMatch = form.value.password === form.value.confirmPassword
  
  return usernameValid && passwordValid && passwordsMatch
})

// Username validation helper
const validateUsername = (username: string): string => {
  const trimmed = username.trim()
  if (trimmed.length < 4) return '用户名至少需要4个字符'
  if (trimmed.length > 20) return '用户名不能超过20个字符'
  if (!/^[\w]+$/.test(trimmed)) return '用户名只能包含字母、数字和下划线'
  return ''
}

// Password validation helper
const validatePassword = (password: string): string => {
  if (password.length < 6) return '密码至少需要6个字符'
  return ''
}

// Reset form when dialog opens
watch(isOpen, (newValue) => {
  if (newValue) {
    form.value = { username: '', password: '', confirmPassword: '' }
    showPassword.value = false
    showConfirmPassword.value = false
    error.value = ''
    success.value = ''
  }
})

// Handle close
function handleClose(): void {
  if (!loading.value) {
    isOpen.value = false
  }
}

// Handle submit
async function handleSubmit(): Promise<void> {
  if (!isFormValid.value || loading.value) return

  loading.value = true
  error.value = ''
  success.value = ''

  // Validate inputs
  const usernameError = validateUsername(form.value.username)
  if (usernameError) {
    error.value = usernameError
    loading.value = false
    return
  }

  const passwordError = validatePassword(form.value.password)
  if (passwordError) {
    error.value = passwordError
    loading.value = false
    return
  }

  if (form.value.password !== form.value.confirmPassword) {
    error.value = '两次输入的密码不一致'
    loading.value = false
    return
  }

  try {
    const result = await authStore.register({
      username: form.value.username.trim(),
      password: form.value.password
    })
    
    if (result.success) {
      success.value = '注册成功！正在跳转...'
      
      // authStore.register() 已经自动完成了登录，只需延迟后关闭对话框
      setTimeout(() => {
        emit('success')
        isOpen.value = false
      }, 1000)
    } else {
      error.value = result.error || '注册失败，请稍后重试'
    }
  } catch (e) {
    error.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-form {
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

.help-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
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
}

.form-error svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.form-success {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: rgba(52, 199, 89, 0.1);
  border-radius: var(--radius-md);
  color: var(--color-success);
  font-size: var(--font-size-sm);
}

.form-success svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

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

.btn-primary:active:not(:disabled) {
  background-color: var(--color-accent-active);
}

.btn-secondary {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-bg-tertiary);
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
