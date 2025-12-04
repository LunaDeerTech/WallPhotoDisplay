<template>
  <Transition name="fade-slide">
    <div v-if="isOffline" class="offline-indicator">
      <svg class="offline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 1l22 22M9 9a3 3 0 004.134 4.134M5.636 5.636A9 9 0 0118.364 18.364"/>
        <path d="M12 3c4.97 0 9 4.03 9 9 0 1.83-.55 3.53-1.49 4.95"/>
        <path d="M12 12a3 3 0 013 3"/>
      </svg>
      <span>离线模式</span>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isOffline = ref(!navigator.onLine)

const updateOnlineStatus = () => {
  isOffline.value = !navigator.onLine
}

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})
</script>

<style scoped>
.offline-indicator {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10001;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #f59e0b;
  color: white;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.offline-icon {
  width: 18px;
  height: 18px;
}

/* 动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}
</style>
