<template>
  <Modal
    v-model="isOpen"
    title="重置密码"
    subtitle="输入用户名或邮箱，系统将发送新密码到您的邮箱"
    size="sm"
    @close="handleClose"
  >
    <form class="reset-form" @submit.prevent="handleSubmit">
      <!-- Identifier input -->
      <div class="form-group">
        <label for="reset-identifier" class="form-label">用户名或邮箱</label>
        <input
          id="reset-identifier"
          v-model="form.identifier"
          type="text"
          class="form-input"
          placeholder="请输入用户名或邮箱"
          :disabled="loading"
          required
        />
      </div>

      <!-- Success message -->
      <Transition name="fade">
        <div v-if="successMessage" class="form-success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span>{{ successMessage }}</span>
        </div>
      </Transition>

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

      <!-- Info message -->
      <Transition name="fade">
        <div v-if="!successMessage && !error" class="form-info">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span>系统将生成一个12位的随机密码并通过邮件发送给您</span>
        </div>
      </Transition>
    </form>

    <template #footer>
      <div class="dialog-actions">
        <button
          type="button"
          class="btn btn-secondary"
          @click="handleClose"
          :disabled="loading"
        >
          关闭
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          @click="handleSubmit"
          :disabled="loading || !form.identifier.trim()"
        >
          <span v-if="loading" class="btn-loading">
            <svg class="spinner" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
            </svg>
          </span>
          <span>{{ loading ? '发送中...' : '重置密码' }}</span>
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Modal from '../common/Modal.vue'
import authApi from '@/api/auth'

interface Props {
  modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

interface ResetForm {
  identifier: string
}

// Local state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const form = ref<ResetForm>({
  identifier: ''
})

const loading = ref(false)
const error = ref('')
const successMessage = ref('')

// Reset form when dialog opens
watch(isOpen, (newValue) => {
  if (newValue) {
    form.value = { identifier: '' }
    error.value = ''
    successMessage.value = ''
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
  if (!form.value.identifier.trim() || loading.value) return

  loading.value = true
  error.value = ''
  successMessage.value = ''

  try {
    const response = await authApi.resetPassword(form.value.identifier.trim())
    
    if (response.success) {
      successMessage.value = response.message || '密码重置成功，请检查您的邮箱'
      // 3秒后自动关闭
      setTimeout(() => {
        if (isOpen.value) {
          isOpen.value = false
        }
      }, 3000)
    } else {
      error.value = response.error || '密码重置失败'
    }
  } catch (e: any) {
    error.value = e.error || '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.reset-form {
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

.form-success {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: rgba(52, 199, 89, 0.1);
  border-radius: var(--radius-md);
  color: var(--color-success);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-sm);
  border-left: 3px solid var(--color-success);
}

.form-success svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
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

.form-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: rgba(0, 122, 255, 0.1);
  border-radius: var(--radius-md);
  color: var(--color-info);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-sm);
  border-left: 3px solid var(--color-info);
}

.form-info svg {
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
  .dialog-actions {
    flex-direction: column-reverse;
    gap: var(--spacing-sm);
    width: 100%;
  }
  
  .dialog-actions .btn {
    flex: 1;
    width: 100%;
    min-width: 0;
  }
  
  .form-info,
  .form-success,
  .form-error {
    font-size: var(--font-size-xs);
  }
}
</style>