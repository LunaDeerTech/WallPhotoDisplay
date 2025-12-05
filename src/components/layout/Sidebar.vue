<template>
  <aside class="sidebar">
    <!-- Logo / Title -->
    <div class="sidebar-header">
      <div class="logo">
        <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <span class="logo-text">照片墙</span>
      </div>
    </div>

    <nav class="sidebar-nav">

      <!-- Filter Photos -->
      <button 
        class="sidebar-btn" 
        @click="$emit('open-dialog', 'filter-photos')"
        title="筛选图片"
      >
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
        <span class="sidebar-btn-label">筛选图片</span>
      </button>

      <!-- Browse Settings - Always visible -->
      <button 
        class="sidebar-btn" 
        @click="$emit('open-dialog', 'browse-settings')"
        title="浏览设置"
      >
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        <span class="sidebar-btn-label">浏览设置</span>
      </button>

      <!-- Manage Photos - Visible when logged in -->
      <button 
        v-if="isLoggedIn"
        class="sidebar-btn" 
        @click="$emit('open-dialog', 'photo-manage')"
        title="管理图片"
      >
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <span class="sidebar-btn-label">管理图片</span>
      </button>

      <!-- Profile - Visible when logged in -->
      <button 
        v-if="isLoggedIn"
        class="sidebar-btn" 
        @click="$emit('open-dialog', 'profile')"
        title="个人信息"
      >
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span class="sidebar-btn-label">个人信息</span>
      </button>

      <!-- User Management - Admin only -->
      <button 
        v-if="isAdmin"
        class="sidebar-btn" 
        @click="$emit('open-dialog', 'user-manage')"
        title="用户管理"
      >
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <span class="sidebar-btn-label">用户管理</span>
      </button>
    </nav>

    <!-- Login button at bottom -->
    <div class="sidebar-footer">
      <button 
        v-if="!isLoggedIn"
        class="sidebar-btn" 
        @click="$emit('open-dialog', 'login')"
        title="登录"
      >
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
          <polyline points="10 17 15 12 10 7"/>
          <line x1="15" y1="12" x2="3" y2="12"/>
        </svg>
        <span class="sidebar-btn-label">登录</span>
      </button>

      <button 
        v-else
        class="sidebar-btn" 
        @click="handleLogout"
        title="退出登录"
      >
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        <span class="sidebar-btn-label">退出</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

type DialogType = 'filter-photos' | 'browse-settings' | 'photo-manage' | 'profile' | 'user-manage' | 'login'

const authStore = useAuthStore()

const isLoggedIn = computed(() => authStore.isLoggedIn)
const isAdmin = computed(() => authStore.isAdmin)

const emit = defineEmits<{
  'open-dialog': [dialog: DialogType]
}>()

const handleLogout = async (): Promise<void> => {
  await authStore.logout()
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  left: var(--spacing-lg);
  top: var(--spacing-lg);
  bottom: var(--spacing-lg);
  width: var(--sidebar-width);
  background-color: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  z-index: var(--z-sticky);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.sidebar-header {
  padding: var(--spacing-lg) var(--spacing-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-accent);
}

.logo-icon {
  width: 32px;
  height: 32px;
}

.logo-text {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  display: none;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--spacing-sm);
  gap: var(--spacing-xs);
  overflow-y: auto;
}

.sidebar-footer {
  padding: var(--spacing-sm);
  border-top: 1px solid var(--color-separator);
}

.sidebar-btn {
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  background-color: transparent;
  transition: all var(--transition-fast);
}

.sidebar-btn:hover {
  background-color: var(--color-accent-light);
  color: var(--color-accent);
}

.sidebar-btn:active {
  transform: scale(0.95);
  background-color: var(--color-accent-lighter);
}

.icon {
  width: 22px;
  height: 22px;
  stroke-width: 1.5;
}

.sidebar-btn-label {
  font-size: 10px;
  font-weight: var(--font-weight-medium);
  display: none;
}

/* Expanded state for wider screens */
@media (min-width: 1400px) {
  .sidebar {
    width: var(--sidebar-expanded-width);
  }

  .sidebar-header {
    padding: var(--spacing-xl) var(--spacing-lg);
  }

  .logo {
    flex-direction: row;
    gap: var(--spacing-sm);
  }

  .logo-icon {
    width: 28px;
    height: 28px;
  }

  .logo-text {
    display: block;
    font-size: var(--font-size-lg);
  }

  .sidebar-nav {
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .sidebar-footer {
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .sidebar-btn {
    aspect-ratio: auto;
    flex-direction: row;
    justify-content: flex-start;
    gap: var(--spacing-md);
    padding: var(--spacing-md) var(--spacing-lg);
  }

  .sidebar-btn-label {
    display: block;
    font-size: var(--font-size-sm);
  }
}

/* Mobile bottom navigation */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: var(--spacing-md);
    right: var(--spacing-md);
    bottom: var(--spacing-md);
    top: auto;
    width: auto;
    height: auto;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    border-radius: var(--radius-xxl);
    border-right: none;
    border-top: none;
    background-color: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    box-shadow: var(--shadow-xl);
    padding: var(--spacing-sm) var(--spacing-md);
    margin-bottom: env(safe-area-inset-bottom, 0);
    z-index: 1000;
  }

  [data-theme="dark"] .sidebar {
    background-color: rgba(28, 28, 30, 0.9);
    border: 1px solid var(--color-separator);
  }

  .sidebar-header {
    display: none;
  }

  .sidebar-nav, 
  .sidebar-footer {
    display: contents;
  }

  .sidebar-btn {
    width: auto;
    aspect-ratio: auto;
    padding: var(--spacing-xs) var(--spacing-sm);
    min-width: 56px;
    height: auto;
    background-color: transparent !important;
    box-shadow: none !important;
    gap: 2px;
    color: var(--color-text-secondary);
    border-radius: var(--radius-lg);
  }
  
  .sidebar-btn:hover {
    background-color: var(--color-bg-secondary) !important;
    color: var(--color-accent);
  }
  
  .sidebar-btn:active {
    transform: scale(0.95);
    opacity: 1;
    background-color: var(--color-bg-tertiary) !important;
  }

  .icon {
    width: 24px;
    height: 24px;
    stroke-width: 2;
  }
  
  .sidebar-btn-label {
    display: block;
    font-size: 10px;
    font-weight: 500;
    line-height: 1;
  }
}
</style>
