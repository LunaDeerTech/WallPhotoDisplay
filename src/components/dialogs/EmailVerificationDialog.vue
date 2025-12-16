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
      </div>

      <!-- Step 2: Input Code -->
      <div v-else class="step-code">
        <p class="info-text">验证码已发送至 {{ email }}</p>
        
        <div class="code-inputs" :class="{ 'shake': shake }">
          <input
            v-for="(digit, index) in 6"
            :key="index"
            ref="codeInputs"
            v-model="code[index]"
            type="text"
            maxlength="1"
            class="code-input"
            :class="{ 'success': isSuccess, 'error': isError }"
            @input="handleInput(index, $event)"
            @keydown.delete="handleDelete(index, $event)"
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
  subtitle: '为了您的账户安全，请验证您的邮箱',
  cancellable: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
}>()

const authStore = useAuthStore()
const toast = useToast()

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
  const value = input.value
  
  // Ensure only numbers
  if (!/^\d*$/.test(value)) {
    code.value[index] = ''
    return
  }

  if (value) {
    // Move to next input
    if (index < 5) {
      codeInputs.value[index + 1]?.focus()
    } else {
      // Last digit entered, verify
      verify()
    }
  }
}

function handleDelete(index: number, event: KeyboardEvent) {
  if (!code.value[index] && index > 0) {
    codeInputs.value[index - 1]?.focus()
  }
}

function handlePaste(event: ClipboardEvent) {
  event.preventDefault()
  const pastedData = event.clipboardData?.getData('text')
  if (!pastedData) return

  const numbers = pastedData.replace(/\D/g, '').split('').slice(0, 6)
  
  numbers.forEach((num, i) => {
    code.value[i] = num
  })
  
  if (numbers.length === 6) {
    verify()
  } else if (numbers.length > 0) {
    codeInputs.value[Math.min(numbers.length, 5)]?.focus()
  }
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