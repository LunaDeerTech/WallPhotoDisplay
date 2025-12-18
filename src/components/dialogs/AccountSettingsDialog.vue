<template>
  <Modal
    v-model="isOpen"
    title="个人中心"
    size="xl"
    class="account-settings-modal"
    @close="handleClose"
  >
    <RegisterDialog
      v-model="showRegister"
      @success="handleLoginSuccess"
    />
    <div class="settings-container">
      <!-- Sidebar (Left) -->
      <div class="settings-sidebar" :class="{ 'hidden-mobile': activeSection !== null }">
        <div class="settings-nav">
          <button
            v-for="item in menuItems"
            :key="item.id"
            class="nav-item"
            :class="{ active: activeSection === item.id }"
            @click="selectSection(item.id)"
          >
            <div class="nav-icon">
              <component :is="item.icon" />
            </div>
            <span class="nav-label">{{ item.label }}</span>
            <svg class="nav-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
        
        <!-- Logout button at bottom of sidebar -->
        <div class="sidebar-footer" v-if="isLoggedIn">
          <button class="nav-item logout-btn" @click="handleLogout">
            <div class="nav-icon logout-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <span class="nav-label">退出登录</span>
          </button>
        </div>
      </div>

      <!-- Content (Right) -->
      <div class="settings-content" :class="{ 'visible-mobile': activeSection !== null }">
        <!-- Mobile Header -->
        <div class="mobile-header">
          <button class="back-btn" @click="activeSection = null">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>返回</span>
          </button>
          <span class="mobile-title">{{ activeSectionLabel }}</span>
        </div>

        <!-- Content Area -->
        <div class="content-scroll">
          <component 
            :is="activeComponent" 
            v-if="activeComponent"
            @success="handleLoginSuccess"
            @register="handleRegister"
            :showHeader="true"
          />
          <div v-else class="empty-state">
            <p>请选择设置项</p>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, h } from 'vue'
import Modal from '../common/Modal.vue'
import BrowseSettings from '../settings/BrowseSettings.vue'
import ProfileSettings from '../settings/ProfileSettings.vue'
import PhotoManager from '../settings/PhotoManager.vue'
import LoginForm from '../auth/LoginForm.vue'
import RegisterDialog from './RegisterDialog.vue'
import { useAuthStore } from '@/stores/auth'
import { useConfigStore } from '@/stores/config'

// Icons
const IconProfile = h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, [
  h('path', { d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' }),
  h('circle', { cx: '12', cy: '7', r: '4' })
])

const IconBrowse = h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, [
  h('circle', { cx: '12', cy: '12', r: '3' }),
  h('path', { d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z' })
])

const IconPhotos = h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, [
  h('rect', { x: '3', y: '3', width: '18', height: '18', rx: '2', ry: '2' }),
  h('circle', { cx: '8.5', cy: '8.5', r: '1.5' }),
  h('polyline', { points: '21 15 16 10 5 21' })
])

interface Props {
  modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const authStore = useAuthStore()
const configStore = useConfigStore()
const isLoggedIn = computed(() => authStore.isLoggedIn)

// State
const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const showRegister = ref(false)
const activeSection = ref<string | null>(null)

// Menu Items
const menuItems = computed(() => {
  const items = []
  
  items.push({
    id: 'profile',
    label: '账号信息',
    icon: IconProfile,
    color: '#007AFF',
    component: isLoggedIn.value ? ProfileSettings : LoginForm
  })

  items.push({
    id: 'browse',
    label: '偏好设置',
    icon: IconBrowse,
    color: '#8E8E93',
    component: BrowseSettings
  })

  if (isLoggedIn.value) {
    items.push({
      id: 'photos',
      label: '我的图片',
      icon: IconPhotos,
      color: '#34C759',
      component: PhotoManager
    })
  }

  return items
})

const activeComponent = computed(() => {
  const item = menuItems.value.find(i => i.id === activeSection.value)
  return item?.component || null
})

const activeSectionLabel = computed(() => {
  const item = menuItems.value.find(i => i.id === activeSection.value)
  return item?.label || ''
})

// Watchers
watch(isOpen, (val) => {
  if (val && !activeSection.value) {
    // Default to first item on desktop, or none on mobile (handled by CSS/layout)
    if (window.innerWidth >= 768) {
      activeSection.value = menuItems.value[0]?.id || null
    }
  }
})

// Methods
function handleClose() {
  isOpen.value = false
  showRegister.value = false
}

function selectSection(id: string) {
  activeSection.value = id
}

function handleLoginSuccess() {
  // Stay on profile section, component will switch automatically
  activeSection.value = 'profile'
  showRegister.value = false
}

function handleRegister() {
  showRegister.value = true
}

function handleLogout() {
  authStore.logout()
  isOpen.value = false
}
</script>

<style scoped>
.settings-container {
  display: flex;
  height: 80vh;
  min-height: 600px;
  max-height: 900px;
  overflow: hidden;
  background: var(--color-bg-elevated);
}

/* Override modal size */
:deep(.modal-container) {
  max-width: 1600px !important;
  width: 95vw !important;
}

/* Sidebar */
.settings-sidebar {
  width: 100%;
  background: var(--color-bg-elevated);
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-border);
}

.settings-nav {
  flex: 1;
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
}

.nav-item:hover {
  background: var(--color-bg-tertiary);
}

.nav-item.active {
  background: var(--color-bg-tertiary);
  color: var(--color-accent);
}

.nav-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}

.nav-item.active .nav-icon {
  color: var(--color-accent);
}

.nav-icon svg {
  width: 20px;
  height: 20px;
}

.nav-label {
  flex: 1;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.nav-item.active .nav-label {
  color: var(--color-accent);
}

.nav-arrow {
  width: 16px;
  height: 16px;
  color: var(--color-text-tertiary);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.nav-item.active .nav-arrow {
  opacity: 1;
}

.sidebar-footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

.logout-btn {
  background: transparent;
  color: var(--color-danger);
}

.nav-item.logout-btn:hover {
  background-color: var(--color-bg-danger-light);
}

.logout-icon {
  color: var(--color-danger);
}

.logout-btn .nav-label {
  color: var(--color-danger);
}

/* Content */
.settings-content {
  flex: 1;
  background: var(--color-bg-elevated);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mobile-header {
  display: none;
  align-items: center;
  padding: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: none;
  color: var(--color-accent);
  font-size: 1rem;
  cursor: pointer;
  padding: var(--spacing-xs);
  flex-shrink: 0;
  white-space: nowrap;
}

.mobile-title {
  flex: 1;
  text-align: center;
  font-weight: 600;
  margin-right: 40px; /* Balance back button */
}

.content-scroll {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-tertiary);
}

/* Responsive Layout */
@media (min-width: 768px) {
  .settings-sidebar {
    width: 220px;
    flex-shrink: 0;
  }
  
  .settings-content {
    display: flex !important; /* Always visible on desktop */
  }
  
  .nav-item {
    background: transparent;
  }
  
  .nav-item.active {
    background: var(--color-bg-tertiary);
    color: inherit;
  }
}

@media (max-width: 767px) {
  .settings-container {
    position: relative;
  }

  .settings-sidebar {
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    z-index: 1;
    transition: transform 0.3s ease;
    border-right: none;
    overflow-y: auto;
  }

  .settings-nav {
    flex: none;
    overflow-y: visible;
  }

  .sidebar-footer {
    border-top: none;
    padding-top: 0;
  }

  .settings-content {
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    z-index: 2;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  }

  .settings-sidebar.hidden-mobile {
    transform: translateX(-30%);
  }

  .settings-content.visible-mobile {
    transform: translateX(0);
  }

  .mobile-header {
    display: flex;
  }
}
</style>
