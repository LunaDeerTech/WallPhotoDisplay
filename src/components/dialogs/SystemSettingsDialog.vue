<template>
  <Modal
    v-model="isOpen"
    title="后台管理"
    size="xl"
    class="system-settings-modal"
    @close="handleClose"
  >
    <div class="settings-container">
      <!-- Sidebar (Left) -->
      <div class="settings-sidebar" :class="{ 'hidden-mobile': activeSection !== null }">
        <div class="settings-nav">
          <button
            v-for="item in visibleMenuItems"
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
import UserManagement from '../settings/UserManagement.vue'
import AboutSystem from '../settings/AboutSystem.vue'
import { useAuthStore } from '@/stores/auth'

// Icons
const IconUsers = h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, [
  h('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }),
  h('circle', { cx: '9', cy: '7', r: '4' }),
  h('path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }),
  h('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' })
])

const IconInfo = h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, [
  h('circle', { cx: '12', cy: '12', r: '10' }),
  h('line', { x1: '12', y1: '16', x2: '12', y2: '12' }),
  h('line', { x1: '12', y1: '8', x2: '12.01', y2: '8' })
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

// State
const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const activeSection = ref<string | null>(null)

// Menu Items
const menuItems = [
  {
    id: 'user-management',
    label: '用户管理',
    icon: IconUsers,
    component: UserManagement,
    requiresAdmin: true
  },
  {
    id: 'about-system',
    label: '关于系统',
    icon: IconInfo,
    component: AboutSystem,
    requiresAdmin: false
  }
]

const visibleMenuItems = computed(() => {
  return menuItems.filter(item => !item.requiresAdmin || authStore.isAdmin)
})

const activeComponent = computed(() => {
  const item = menuItems.find(i => i.id === activeSection.value)
  return item ? item.component : null
})

const activeSectionLabel = computed(() => {
  const item = menuItems.find(i => i.id === activeSection.value)
  return item ? item.label : ''
})

// Methods
function selectSection(id: string) {
  activeSection.value = id
}

function handleClose() {
  isOpen.value = false
}

// Watch for open to reset state if needed
watch(isOpen, (newValue) => {
  if (newValue) {
    const isMobile = window.innerWidth < 768
    
    if (isMobile) {
      // On mobile, always start with menu
      activeSection.value = null
    } else {
      // On desktop, select first available item if nothing selected or current selection invalid
      if (!activeSection.value || !visibleMenuItems.value.find(i => i.id === activeSection.value)) {
        if (visibleMenuItems.value.length > 0) {
          activeSection.value = visibleMenuItems.value[0].id
        } else {
          activeSection.value = null
        }
      }
    }
  }
})
</script>

<style scoped>
.settings-container {
  display: flex;
  height: 70vh;
  min-height: 500px;
  max-height: 800px;
  overflow: hidden;
  margin: calc(var(--spacing-md) * -1); /* Negate modal padding */
}

/* Override modal size */
:deep(.modal-container) {
  max-width: 1600px !important;
  width: 95vw !important;
}

.settings-sidebar {
  width: 100%;
  background-color: var(--color-bg-elevated);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
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
  color: var(--color-text-secondary);
}

.nav-item:hover {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.nav-item.active {
  background-color: var(--color-bg-tertiary);
  color: var(--color-accent);
  box-shadow: none;
}

.nav-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-icon svg {
  width: 20px;
  height: 20px;
}

.nav-label {
  flex: 1;
  font-size: 1rem;
  font-weight: 500;
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
  padding: var(--spacing-lg);
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
