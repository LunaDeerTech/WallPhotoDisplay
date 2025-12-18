<template>
  <Modal
    :model-value="modelValue"
    :title="title"
    :subtitle="subtitle"
    size="sm"
    :show-close="cancellable"
    :close-on-overlay="cancellable"
    :close-on-esc="cancellable"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="verification-content">
      <!-- Step 1: Input Email -->
      <div v-if="step === 1" class="step-email">
        <div class="form-group">
          <label for="email">邮箱地址</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="请输入您的邮箱"
            :disabled="loading"
            @keyup.enter="sendCode"
          />
          <p v-if="error" class="error-text">{{ error }}</p>
        </div>
        <button 
          class="btn btn-primary btn-block" 
          :disabled="loading || !isValidEmail"
          @click="sendCode"
        >
          {{ loading ? '发送中...' : '发送验证码' }}
        </button>
        
        <!-- 退出登录按钮 - 仅在不允许关闭时显示 -->
        <button 
          v-if="!cancellable"
          type="button"
          class="btn btn-danger btn-block"
          @click="handleLogout"
          :disabled="loading"
          style="margin-top: var(--spacing-sm);"
        >
          退出登录
        </button>
      </div>

      <!-- Step 2: Input Code -->
      <div v-else class="step-code">
        <p class="info-text">验证码已发送至 {{ email }}</p>
        
        <div class="code-inputs" :class="{ 'shake': shake }">
          <input
            v-for="i in 6"
            :key="i"
            ref="codeInputs"
            v-model="code[i-1]"
            type="text"
            maxlength="1"
            class="code-input"
            :class="{ 'success': isSuccess, 'error': isError }"
            @input="handleInput(i-1, $event)"
            @keydown.delete="handleDelete(i-1, $event)"
            @paste="handlePaste"
          />
        </div>

        <div class="actions">
          <button 
            class="btn btn-text" 
            :disabled="timer > 0 || loading"
            @click="resendCode"
          >
            {{ timer > 0 ? `重新发送 (${timer}s)` : '重新发送' }}
          </button>
          <button class="btn btn-text" @click="step = 1">修改邮箱</button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import Modal from '@/components/common/Modal.vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  subtitle?: string
  cancellable?: boolean
}>(), {
  title: '邮箱验证',
  subtitle: '请绑定您的邮箱后继续使用',
  cancellable: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
}>()

const authStore = useAuthStore()
const toast = useToast()

const handleLogout = () => {
  authStore.logout()
  emit('update:modelValue', false)
}

const step = ref(1)
const email = ref('')
const code = ref<string[]>(new Array(6).fill(''))
const loading = ref(false)
const error = ref('')
const timer = ref(0)
const shake = ref(false)
const isSuccess = ref(false)
const isError = ref(false)
const codeInputs = ref<HTMLInputElement[]>([])
let timerInterval: number | null = null

// Reset state when dialog opens
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    step.value = 1
    code.value = new Array(6).fill('')
    isSuccess.value = false
    isError.value = false
    error.value = ''
    // Clear the inputs array when dialog opens
    codeInputs.value = []
    // Pre-fill email if available and empty
    if (!email.value && authStore.user?.email) {
      email.value = authStore.user.email
    }
  }
})

const isValidEmail = computed(() => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
})

async function sendCode() {
  if (!isValidEmail.value) return
  
  loading.value = true
  error.value = ''
  
  const success = await authStore.sendVerificationCode(email.value)
  
  loading.value = false
  
  if (success) {
    step.value = 2
    startTimer()
    nextTick(() => {
      codeInputs.value[0]?.focus()
    })
  } else {
    error.value = '发送失败，请稍后重试或检查邮箱是否已被使用'
  }
}

async function resendCode() {
  if (timer.value > 0) return
  await sendCode()
}

function startTimer() {
  timer.value = 60
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = window.setInterval(() => {
    timer.value--
    if (timer.value <= 0 && timerInterval) {
      clearInterval(timerInterval)
    }
  }, 1000)
}

function handleInput(index: number, event: Event) {
  const input = event.target as HTMLInputElement
  const rawValue = input.value
  const cleanValue = rawValue.replace(/\D/g, '').slice(-1) // 只保留最后一位数字
  
  // 强制更新输入框的值
  if (input.value !== cleanValue) {
    input.value = cleanValue
  }
  
  // 更新code数组
  code.value[index] = cleanValue
  
  // 延迟一点移动焦点，确保v-model更新完成
  if (cleanValue && index < 5) {
    setTimeout(() => {
      const nextInput = codeInputs.value[index + 1]
      if (nextInput) {
        nextInput.focus()
        nextInput.select()
      }
    }, 10)
  } else if (cleanValue && index === 5) {
    // 最后一个数字输入完成，自动验证
    setTimeout(() => verify(), 10)
  }
}

function handleDelete(index: number, event: KeyboardEvent) {
  if (!code.value[index] && index > 0) {
    event.preventDefault()
    // 清空前一个输入框并聚焦
    setTimeout(() => {
      const prevInput = codeInputs.value[index - 1]
      if (prevInput) {
        prevInput.value = ''
        code.value[index - 1] = ''
        prevInput.focus()
      }
    }, 10)
  }
}

function handlePaste(event: ClipboardEvent) {
  event.preventDefault()
  const pastedData = event.clipboardData?.getData('text')
  if (!pastedData) return

  const numbers = pastedData.replace(/\D/g, '').slice(0, 6)
  
  // 填充输入框
  numbers.split('').forEach((num, i) => {
    if (codeInputs.value[i]) {
      codeInputs.value[i].value = num
      code.value[i] = num
    }
  })
  
  // 移动焦点并验证
  setTimeout(() => {
    if (numbers.length === 6) {
      verify()
    } else if (numbers.length > 0) {
      const nextIndex = Math.min(numbers.length, 5)
      codeInputs.value[nextIndex]?.focus()
    }
  }, 10)
}

async function verify() {
  const fullCode = code.value.join('')
  if (fullCode.length !== 6) return

  loading.value = true
  isError.value = false
  
  const success = await authStore.verifyEmail(email.value, fullCode)
  
  loading.value = false
  
  if (success) {
    isSuccess.value = true
    toast.success('邮箱验证成功')
    emit('success')
    // Update store user info immediately if needed, though verifyEmail usually handles backend update
    // and we might need to fetch user again or update local state.
    // authStore.fetchCurrentUser() is good practice here.
    await authStore.fetchCurrentUser()
    
    setTimeout(() => {
      emit('update:modelValue', false)
    }, 1500)
  } else {
    isError.value = true
    shake.value = true
    setTimeout(() => {
      shake.value = false
      isError.value = false
      code.value = new Array(6).fill('')
      codeInputs.value[0]?.focus()
    }, 1000)
  }
}

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<style scoped>
.verification-content {
  padding: 1rem 0;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.btn-block {
  width: 100%;
  padding: 0.75rem;
}

.btn-danger {
  background-color: var(--color-error);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: var(--color-error-hover);
}

.info-text {
  text-align: center;
  margin-bottom: 1.5rem;
  color: var(--color-text-secondary);
}

.code-inputs {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.code-input {
  width: 3rem;
  height: 3.5rem;
  text-align: center;
  font-size: 1.5rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  transition: all 0.2s;
}

.code-input:focus {
  border-color: var(--color-primary);
  outline: none;
}

.code-input.success {
  border-color: var(--color-success);
  box-shadow: 0 0 10px var(--color-success);
}

.code-input.error {
  border-color: var(--color-error);
  box-shadow: 0 0 10px var(--color-error);
}

.shake {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
}

.btn-text {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  padding: 0.5rem;
}

.btn-text:disabled {
  color: var(--color-text-disabled);
  cursor: not-allowed;
}

.error-text {
  color: var(--color-error);
  font-size: 0.875rem;
  margin-top: 0.5rem;
}
</style>