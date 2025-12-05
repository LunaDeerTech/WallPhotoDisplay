<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="modal-overlay"
        @click.self="handleOverlayClick"
      >
        <div
          class="modal-container"
          :class="[sizeClass, { 'modal-fullscreen': fullscreen }]"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
        >
          <!-- Header -->
          <div v-if="showHeader" class="modal-header">
            <div class="modal-title-wrapper">
              <h2 :id="titleId" class="modal-title">{{ title }}</h2>
              <p v-if="subtitle" class="modal-subtitle">{{ subtitle }}</p>
            </div>
            <button
              v-if="showClose"
              class="modal-close-btn"
              @click="handleClose"
              aria-label="关闭"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="modal-body" :class="{ 'modal-body-scroll': scrollable }">
            <slot></slot>
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from 'vue'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

interface Props {
  modelValue?: boolean
  title?: string
  subtitle?: string
  size?: ModalSize
  showClose?: boolean
  showHeader?: boolean
  closeOnOverlay?: boolean
  closeOnEsc?: boolean
  scrollable?: boolean
  fullscreen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  title: '',
  subtitle: '',
  size: 'md',
  showClose: true,
  showHeader: true,
  closeOnOverlay: true,
  closeOnEsc: true,
  scrollable: true,
  fullscreen: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
}>()

// Define slots for type checking
const slots = defineSlots<{
  default(props: Record<string, never>): unknown
  footer(props: Record<string, never>): unknown
}>()

// Generate unique ID for accessibility
const titleId = computed(() => `modal-title-${Math.random().toString(36).substr(2, 9)}`)

// Size class
const sizeClass = computed(() => `modal-${props.size}`)

// Handle overlay click
function handleOverlayClick() {
  if (props.closeOnOverlay) {
    handleClose()
  }
}

// Handle close
function handleClose() {
  emit('update:modelValue', false)
  emit('close')
}

// Handle ESC key
function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && props.closeOnEsc && props.modelValue) {
    handleClose()
  }
}

// Body scroll lock
watch(() => props.modelValue, (value) => {
  if (value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  background-color: var(--color-overlay);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.modal-container {
  position: relative;
  z-index: var(--z-modal);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - var(--spacing-xl) * 2);
  background-color: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

/* Modal sizes */
.modal-sm {
  width: 100%;
  max-width: 360px;
}

.modal-md {
  width: 100%;
  max-width: 480px;
}

.modal-lg {
  width: 100%;
  max-width: 640px;
}

.modal-xl {
  width: 100%;
  max-width: 960px;
}

.modal-fullscreen {
  width: calc(100vw - var(--spacing-lg) * 2);
  height: calc(100vh - var(--spacing-lg) * 2);
  max-width: none;
  max-height: none;
  border-radius: var(--radius-lg);
}

/* Header */
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-sm);
  flex-shrink: 0;
}

.modal-title-wrapper {
  flex: 1;
  min-width: 0;
}

.modal-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
  margin: 0;
}

.modal-subtitle {
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-normal);
}

.modal-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-round);
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.modal-close-btn:hover {
  background-color: var(--color-border);
  color: var(--color-text-primary);
}

.modal-close-btn:active {
  transform: scale(0.95);
}

.modal-close-btn svg {
  width: 16px;
  height: 16px;
}

/* Body */
.modal-body {
  padding: var(--spacing-md) var(--spacing-lg);
  flex: 1;
  min-height: 0;
}

.modal-body-scroll {
  overflow-y: auto;
  overscroll-behavior: contain;
}

/* Footer */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg) var(--spacing-lg);
  flex-shrink: 0;
}

/* iOS-style modal transitions */
.modal-enter-active {
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-leave-active {
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease;
}

.modal-leave-active .modal-container {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
}

.modal-enter-from .modal-container {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

.modal-leave-to .modal-container {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

/* Mobile responsive */
@media (max-width: 640px) {
  .modal-overlay {
    padding: 0;
    align-items: flex-end;
  }

  .modal-container {
    max-height: 85vh;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .modal-sm,
  .modal-md,
  .modal-lg,
  .modal-xl {
    max-width: 100%;
    width: 100%;
  }

  .modal-enter-from .modal-container {
    transform: translateY(100%);
  }

  .modal-leave-to .modal-container {
    transform: translateY(100%);
  }
}
</style>
