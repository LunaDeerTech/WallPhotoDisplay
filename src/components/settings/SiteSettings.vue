<template>
  <div class="site-settings">
    <h3 class="section-title">系统设置</h3>

    
    
    <form @submit.prevent="handleSubmit" class="settings-form">

      <h4 class="sub-section-title">网站信息</h4>

      <div class="form-group">
        <label>网站名称</label>
        <input 
          v-model="form.siteName" 
          type="text" 
          class="form-input" 
          placeholder="Wall Photo Display"
          required
        />
        <span class="help-text">显示在浏览器标签页标题</span>
      </div>

      <div class="form-group">
        <label>网站介绍</label>
        <textarea 
          v-model="form.siteDescription" 
          class="form-input" 
          rows="3"
          placeholder="A multi-user photo wall application"
        ></textarea>
      </div>

      <h4 class="sub-section-title">菜单栏设置</h4>

      <div class="preview-section">
        <label>预览</label>
        <div class="preview-box">
          <div class="logo-preview">
            <div class="logo-icon-wrapper" v-if="form.menuIconUrl">
              <img :src="form.menuIconUrl" alt="Logo" />
            </div>
            <span class="logo-text">{{ form.menuTitle }}</span>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>菜单栏标题</label>
        <input 
          v-model="form.menuTitle" 
          type="text" 
          class="form-input" 
          placeholder="照片墙"
          required
        />
        <span class="help-text">显示在左侧菜单栏顶部</span>
      </div>

      <div class="form-group">
        <label>菜单栏图标 (图片URL)</label>
        <input 
          v-model="form.menuIconUrl" 
          type="text"
          class="form-input" 
          placeholder="https://example.com/logo.png"
        />
        <span class="help-text">请输入图片链接，留空则仅显示标题</span>
      </div>

      <h4 class="sub-section-title">访问控制</h4>

      <div class="form-group">
        <div class="setting-row">
          <div class="setting-info">
            <label class="setting-label">强制登录</label>
            <span class="help-text">开启后，未登录用户无法查看照片墙，必须登录才能访问</span>
          </div>
          <label class="switch">
            <input 
              v-model="form.forceLogin" 
              type="checkbox" 
            />
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <div class="form-group">
        <div class="setting-row">
          <div class="setting-info">
            <label class="setting-label">上传审核</label>
            <span class="help-text">开启后，普通用户上传的照片需要管理员审核通过后才能显示</span>
          </div>
          <label class="switch">
            <input 
              v-model="form.uploadReview" 
              type="checkbox" 
            />
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? '保存中...' : '保存设置' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useConfigStore } from '@/stores/config'
import { storeToRefs } from 'pinia'
import { useToast } from '@/composables/useToast'

const configStore = useConfigStore()
const { config } = storeToRefs(configStore)
const toast = useToast()
const loading = ref(false)

const form = ref({
  siteName: '',
  siteDescription: '',
  menuTitle: '',
  menuIconUrl: '',
  forceLogin: false,
  uploadReview: false
})

// Watch for config changes to update form (e.g. if loaded after mount)
watch(config, (newConfig) => {
  form.value = {
    siteName: newConfig?.siteName ?? '',
    siteDescription: newConfig?.siteDescription ?? '',
    menuTitle: newConfig?.menuTitle ?? '',
    menuIconUrl: newConfig?.menuIconUrl ?? '',
    forceLogin: !!newConfig?.forceLogin,
    uploadReview: !!newConfig?.uploadReview
  }
}, { immediate: true })

async function handleSubmit() {
  loading.value = true
  try {
    await configStore.updateConfig(form.value)
    toast.success('设置已保存')
  } catch (error) {
    toast.error('保存失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.site-settings {
  max-width: 600px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-primary);
}

.sub-section-title {
    font-size: 1.25rem;
    font-weight: 500;
    margin-top: calc(var(--spacing-xl) - var(--spacing-md));
    margin-bottom: calc(var(--spacing-md) - 36px);
    color: var(--color-text-primary);
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-group label {
  font-weight: 500;
  color: var(--color-text-primary);
}

.form-input {
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 1rem;
}
.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-transparent);
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-label {
  font-weight: 500;
  color: var(--color-text-primary);
}

/* Switch styles */
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-bg-tertiary);
  transition: .3s;
  border-radius: 24px;
  border: 1px solid var(--color-border);
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

input:checked + .slider {
  background-color: var(--color-accent);
  border-color: var(--color-accent);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

input:focus + .slider {
  box-shadow: 0 0 0 2px var(--color-accent-transparent);
}

.code-font {
  font-family: monospace;
  font-size: 0.9rem;
}

.help-text {
  font-size: 0.875rem;
  color: var(--color-text-tertiary);
}

.preview-section {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
}

.preview-box {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
}

.logo-preview {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text-primary);
}

.logo-icon-wrapper {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.logo-icon-wrapper img) {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.logo-text {
  font-weight: 600;
  font-size: 1.125rem;
}

.form-actions {
  margin-top: var(--spacing-md);
  display: flex;
  justify-content: flex-end;
}

.btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-primary {
  background: var(--color-accent);
  color: white;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
