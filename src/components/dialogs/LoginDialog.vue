<template>
  <Modal
    v-model="isOpen"
    title="登录"
    subtitle="请输入账号和密码"
    size="sm"
    @close="handleClose"
  >
    <!-- 使用 LoginForm 组件 -->
    <LoginForm
      :showCancel="true"
      :allowRegistration="allowRegistration"
      :showForgotPassword="true"
      @success="handleLoginSuccess"
      @cancel="handleClose"
      @register="handleRegister"
      @forgot-password="handleForgotPassword"
      ref="loginFormRef"
    />
  </Modal>

  <!-- 密码重置对话框 -->
  <ResetPasswordDialog v-model="showResetPassword" />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Modal from '../common/Modal.vue'
import LoginForm from '../common/LoginForm.vue'
import ResetPasswordDialog from './ResetPasswordDialog.vue'
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

const configStore = useConfigStore()

// Local state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const showResetPassword = ref(false)
const loginFormRef = ref<InstanceType<typeof LoginForm> | null>(null)

// Computed
const allowRegistration = computed(() => {
  return configStore.config?.allowRegistration ?? false
})

// Handle close
function handleClose(): void {
  isOpen.value = false
}

// Handle login success from LoginForm
function handleLoginSuccess(): void {
  emit('success')
  isOpen.value = false
}

// Handle register
function handleRegister(): void {
  emit('register')
}

// Handle forgot password
function handleForgotPassword(): void {
  showResetPassword.value = true
}
</script>

<style scoped>
/* LoginDialog 使用 LoginForm 的完整布局，无需额外样式 */
</style>
