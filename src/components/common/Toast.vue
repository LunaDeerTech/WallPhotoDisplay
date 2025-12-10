<template>
  <Teleport to="body">
    <TransitionGroup 
      name="toast" 
      tag="div" 
      class="toast-container"
    >
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        class="toast-item"
        :class="[`toast-${toast.type}`]"
        role="alert"
      >
        <div class="toast-icon">
          <svg v-if="toast.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else-if="toast.type === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M15 9l-6 6M9 9l6 6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else-if="toast.type === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        </div>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" @click="remove(toast.id)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, remove } = useToast()
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast-item {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 300px;
  max-width: 90vw;
  color: var(--color-text-primary);
  font-size: 0.95rem;
  border: 1px solid transparent;
}

.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.toast-icon svg {
  width: 100%;
  height: 100%;
}

.toast-message {
  flex: 1;
  line-height: 1.4;
}

.toast-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.toast-close:hover {
  opacity: 1;
}

.toast-close svg {
  width: 16px;
  height: 16px;
}

/* Types */
.toast-success {
  border-color: #d1fae5;
  background: #ecfdf5;
}
.toast-success .toast-icon {
  color: #059669;
}

.toast-error {
  border-color: #fee2e2;
  background: #fef2f2;
}
.toast-error .toast-icon {
  color: #dc2626;
}

.toast-warning {
  border-color: #fef3c7;
  background: #fffbeb;
}
.toast-warning .toast-icon {
  color: #d97706;
}

.toast-info {
  border-color: #e0f2fe;
  background: #f0f9ff;
}
.toast-info .toast-icon {
  color: #0284c7;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .toast-item {
    background: #1f2937;
    color: #f3f4f6;
    border-color: #374151;
  }
  
  .toast-success {
    background: #064e3b;
    border-color: #065f46;
  }
  .toast-success .toast-icon {
    color: #34d399;
  }

  .toast-error {
    background: #7f1d1d;
    border-color: #991b1b;
  }
  .toast-error .toast-icon {
    color: #f87171;
  }

  .toast-warning {
    background: #78350f;
    border-color: #92400e;
  }
  .toast-warning .toast-icon {
    color: #fbbf24;
  }

  .toast-info {
    background: #0c4a6e;
    border-color: #075985;
  }
  .toast-info .toast-icon {
    color: #38bdf8;
  }
}

/* Transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
