<template>
  <Transition name="slide-down">
    <div v-if="needRefresh" class="update-prompt">
      <div class="update-content">
        <svg class="update-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          <path d="M12 8v4l2 2"/>
        </svg>
        <span>发现新版本，点击更新</span>
        <button class="btn-update" @click="updateServiceWorker">
          立即更新
        </button>
        <button class="btn-close" @click="closePrompt" aria-label="关闭">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const needRefresh = ref(false)
let updateSW: ((reloadPage?: boolean) => Promise<void>) | null = null

const closePrompt = (): void => {
  needRefresh.value = false
}

const updateServiceWorker = async (): Promise<void> => {
  if (updateSW) {
    await updateSW(true)
  }
}

onMounted(async () => {
  // 检查是否支持 Service Worker
  if ('serviceWorker' in navigator) {
    try {
      // 动态导入 PWA 注册模块
      const { registerSW } = await import('virtual:pwa-register')
      
      updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          needRefresh.value = true
        },
        onOfflineReady() {
          console.log('应用已准备好离线使用')
        },
        onRegisteredSW(swUrl: string, r?: ServiceWorkerRegistration) {
          console.log('Service Worker 已注册:', swUrl)
          // 定期检查更新 (每小时)
          if (r) {
            setInterval(() => {
              r.update()
            }, 60 * 60 * 1000)
          }
        },
        onRegisterError(error: Error) {
          console.error('Service Worker 注册失败:', error)
        }
      })
    } catch (error) {
      // PWA 未启用或开发模式
      console.log('PWA 未启用')
    }
  }
})
</script>

<style scoped>
.update-prompt {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10002;
}

.update-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-accent);
  color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(74, 144, 217, 0.4);
  font-size: 14px;
}

.update-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.btn-update {
  padding: 6px 14px;
  background: white;
  color: var(--color-accent);
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-update:hover {
  transform: scale(1.05);
}

.btn-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.btn-close svg {
  width: 14px;
  height: 14px;
  color: white;
}

/* 动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

/* 移动端适配 */
@media (max-width: 480px) {
  .update-prompt {
    width: calc(100% - 32px);
  }
  
  .update-content {
    flex-wrap: wrap;
    justify-content: center;
    text-align: center;
  }
  
  .update-content span {
    flex-basis: 100%;
    margin-bottom: 8px;
  }
}
</style>
