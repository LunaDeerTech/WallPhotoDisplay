<template>
  <div class="site-settings">
    <h3 class="section-title">系统设置</h3>
    
    <form @submit.prevent="handleSubmit" class="settings-form">
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

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? '保存中...' : '保存设置' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useConfigStore } from '@/stores/config'
import { storeToRefs } from 'pinia'

const configStore = useConfigStore()
const { config } = storeToRefs(configStore)
const loading = ref(false)

const form = ref({
  siteName: '',
  siteDescription: '',
  menuTitle: '',
  menuIconUrl: ''
})

// Watch for config changes to update form (e.g. if loaded after mount)
watch(config, (newConfig) => {
  form.value = { ...newConfig }
}, { immediate: true })

async function handleSubmit() {
  loading.value = true
  try {
    await configStore.updateConfig(form.value)
    alert('设置已保存')
  } catch (error) {
    alert('保存失败')
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
