<template>
  <Transition name="slide-up">
    <div v-if="showInstallPrompt" class="pwa-install-prompt">
      <div class="prompt-content">
        <div class="prompt-icon">
          <img src="/icons/icon-96x96.png" alt="App Icon" />
        </div>
        <div class="prompt-text">
          <h4>安装照片墙应用</h4>
          <p>添加到主屏幕，获得更好的体验</p>
        </div>
        <div class="prompt-actions">
          <button class="btn-dismiss" @click="dismissPrompt">稍后</button>
          <button class="btn-install" @click="installApp">安装</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const showInstallPrompt = ref(false)
let deferredPrompt = null

// 处理 beforeinstallprompt 事件
const handleBeforeInstallPrompt = (e) => {
  // 阻止默认的安装提示
  e.preventDefault()
  // 保存事件以便稍后触发
  deferredPrompt = e
  
  // 检查用户是否之前已经关闭过提示
  const dismissed = localStorage.getItem('pwa-install-dismissed')
  const dismissedTime = dismissed ? parseInt(dismissed) : 0
  const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
  
  // 如果超过7天或从未关闭过，显示安装提示
  if (!dismissed || daysSinceDismissed > 7) {
    showInstallPrompt.value = true
  }
}

// 安装应用
const installApp = async () => {
  if (!deferredPrompt) return
  
  // 显示安装提示
  deferredPrompt.prompt()
  
  // 等待用户响应
  const { outcome } = await deferredPrompt.userChoice
  
  if (outcome === 'accepted') {
    console.log('用户接受了安装')
  } else {
    console.log('用户取消了安装')
  }
  
  // 重置
  deferredPrompt = null
  showInstallPrompt.value = false
}

// 关闭提示
const dismissPrompt = () => {
  showInstallPrompt.value = false
  localStorage.setItem('pwa-install-dismissed', Date.now().toString())
}

// 监听应用安装完成
const handleAppInstalled = () => {
  showInstallPrompt.value = false
  deferredPrompt = null
  console.log('PWA 已安装')
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.addEventListener('appinstalled', handleAppInstalled)
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.removeEventListener('appinstalled', handleAppInstalled)
})
</script>

<style scoped>
.pwa-install-prompt {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  width: calc(100% - 40px);
  max-width: 400px;
}

.prompt-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--color-bg-primary);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--color-border);
}

.prompt-icon img {
  width: 48px;
  height: 48px;
  border-radius: 12px;
}

.prompt-text {
  flex: 1;
  min-width: 0;
}

.prompt-text h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.prompt-text p {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.prompt-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-dismiss,
.btn-install {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-dismiss {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.btn-dismiss:hover {
  background: var(--color-bg-secondary);
}

.btn-install {
  background: var(--color-accent);
  border: none;
  color: white;
}

.btn-install:hover {
  background: var(--color-accent-hover, #3a80c9);
  transform: translateY(-1px);
}

/* 动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

/* 移动端适配 */
@media (max-width: 480px) {
  .pwa-install-prompt {
    bottom: 16px;
    width: calc(100% - 32px);
  }
  
  .prompt-content {
    flex-wrap: wrap;
    padding: 12px;
  }
  
  .prompt-actions {
    width: 100%;
    justify-content: flex-end;
    margin-top: 8px;
  }
}
</style>
