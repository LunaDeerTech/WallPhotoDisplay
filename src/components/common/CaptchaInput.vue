<template>
  <div class="captcha-group">
    <label class="form-label">验证码</label>
    <div class="captcha-row">
      <input
        v-model="captchaText"
        type="text"
        class="form-input captcha-input"
        placeholder="请输入验证码"
        :disabled="disabled"
        maxlength="4"
        autocomplete="off"
        @input="handleInput"
      />
      <div
        class="captcha-image"
        :class="{ 'captcha-loading': loading }"
        @click="refreshCaptcha"
        title="点击刷新验证码"
      >
        <div v-if="loading" class="captcha-spinner">
          <svg class="spinner" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
          </svg>
        </div>
        <div v-else-if="captchaSvg" v-html="captchaSvg" class="captcha-svg"></div>
        <div v-else class="captcha-placeholder">点击获取</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import authApi from '@/api/auth'

interface Props {
  disabled?: boolean
  /** Whether captcha is enabled (from config) */
  enabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  enabled: true
})

const emit = defineEmits<{
  'update:captchaId': [value: string]
  'update:captchaText': [value: string]
}>()

const captchaId = ref('')
const captchaText = ref('')
const captchaSvg = ref('')
const loading = ref(false)

function handleInput() {
  emit('update:captchaText', captchaText.value)
}

async function refreshCaptcha() {
  if (loading.value || props.disabled) return

  loading.value = true
  captchaText.value = ''
  emit('update:captchaText', '')

  try {
    const response = await authApi.getCaptcha()
    if (response.success && response.data) {
      captchaId.value = response.data.captchaId
      captchaSvg.value = response.data.captchaSvg
      emit('update:captchaId', response.data.captchaId)
    }
  } catch (e) {
    console.error('Failed to load captcha:', e)
    captchaSvg.value = ''
  } finally {
    loading.value = false
  }
}

/** Reset and refresh captcha (called by parent after failed submission) */
function reset() {
  captchaText.value = ''
  emit('update:captchaText', '')
  refreshCaptcha()
}

defineExpose({ refreshCaptcha, reset })

onMounted(() => {
  if (props.enabled) {
    refreshCaptcha()
  }
})

watch(() => props.enabled, (val) => {
  if (val && !captchaSvg.value) {
    refreshCaptcha()
  }
})
</script>

<style scoped>
.captcha-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.captcha-row {
  display: flex;
  gap: var(--spacing-md);
  align-items: stretch;
}

.captcha-input {
  flex: 1;
  min-width: 0;
  padding: var(--spacing-md);
  font-size: var(--font-size-md);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
  transition: all var(--transition-fast);
  letter-spacing: 4px;
  font-weight: var(--font-weight-semibold);
}

.captcha-input:focus {
  outline: none;
  border-color: var(--color-accent);
  background-color: var(--color-bg-primary);
  box-shadow: 0 0 0 3px var(--color-accent-light);
}

.captcha-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.captcha-input::placeholder {
  letter-spacing: normal;
  font-weight: var(--font-weight-normal);
  color: var(--color-text-placeholder);
}

.captcha-image {
  width: 150px;
  height: 100%;
  min-height: 44px;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-secondary);
  transition: border-color var(--transition-fast);
  flex-shrink: 0;
}

.captcha-image:hover {
  border-color: var(--color-accent);
}

.captcha-loading {
  opacity: 0.6;
  cursor: wait;
}

.captcha-svg {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.captcha-svg :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}

.captcha-placeholder {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  text-align: center;
}

.captcha-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.captcha-spinner .spinner {
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
  color: var(--color-text-tertiary);
}

.captcha-spinner .spinner circle {
  stroke-dasharray: 60;
  stroke-dashoffset: 45;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
</style>
