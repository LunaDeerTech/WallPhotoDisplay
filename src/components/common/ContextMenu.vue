<template>
  <Teleport to="body">
    <Transition name="context-menu">
      <div
        v-if="visible"
        ref="menuRef"
        class="context-menu"
        :style="menuStyle"
        @contextmenu.prevent
      >
        <template v-for="(item, index) in items" :key="item.id || index">
          <!-- Divider -->
          <div v-if="item.divider" class="context-menu-divider" />
          
          <!-- Menu item -->
          <button
            v-else
            type="button"
            class="context-menu-item"
            :class="{
              'context-menu-item-disabled': item.disabled,
              'context-menu-item-danger': item.danger
            }"
            :disabled="item.disabled"
            @click="handleItemClick(item)"
          >
            <!-- Icon -->
            <span v-if="item.icon" class="context-menu-icon" v-html="getIconSvg(item.icon)">
            </span>
            
            <!-- Label -->
            <span class="context-menu-label">{{ item.label }}</span>
            
            <!-- Shortcut -->
            <span v-if="item.shortcut" class="context-menu-shortcut">
              {{ item.shortcut }}
            </span>
          </button>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'
import type { ContextMenuItem } from '@/types'

interface Props {
  visible?: boolean
  x?: number
  y?: number
  items?: ContextMenuItem[]
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  x: 0,
  y: 0,
  items: () => []
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'select': [item: ContextMenuItem]
  'close': []
}>()

// Refs
const menuRef = ref<HTMLElement | null>(null)

// Computed position with boundary detection
const menuStyle = computed(() => {
  const padding = 8
  const menuWidth = 200
  const menuHeight = props.items.length * 40 // Approximate height
  
  let left = props.x
  let top = props.y
  
  // Check right boundary
  if (typeof window !== 'undefined') {
    if (left + menuWidth + padding > window.innerWidth) {
      left = window.innerWidth - menuWidth - padding
    }
    
    // Check bottom boundary
    if (top + menuHeight + padding > window.innerHeight) {
      top = window.innerHeight - menuHeight - padding
    }
    
    // Ensure minimum position
    if (left < padding) left = padding
    if (top < padding) top = padding
  }
  
  return {
    left: `${left}px`,
    top: `${top}px`
  }
})

// Get icon SVG string by name
function getIconSvg(iconName: string): string {
  const icons: Record<string, string> = {
    'zoom-in': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35"/>
      <path d="M11 8v6M8 11h6"/>
    </svg>`,
    'download': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>`,
    'tag': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>`,
    'trash': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>`,
    'check-square': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="9 11 12 14 22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>`,
    'edit': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>`,
    'copy': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>`,
    'upload': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>`,
    'info': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>`
  }
  
  return icons[iconName] || ''
}

// Handle item click
function handleItemClick(item: ContextMenuItem): void {
  if (item.disabled) return
  
  emit('select', item)
  
  if (item.action) {
    item.action()
  }
  
  close()
}

// Close the menu
function close(): void {
  emit('update:visible', false)
  emit('close')
}

// Handle click outside
function handleClickOutside(event: MouseEvent): void {
  // If menu ref is not available or click is outside the menu, close it
  if (!menuRef.value || !menuRef.value.contains(event.target as Node)) {
    close()
  }
}

// Handle ESC key
function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && props.visible) {
    close()
  }
}

// Track the timestamp when menu opens to prevent immediate close
let openTimestamp = 0

// Lifecycle
watch(() => props.visible, (value) => {
  if (value) {
    openTimestamp = Date.now()
    nextTick(() => {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('contextmenu', handleClickOutsideContextMenu)
      document.addEventListener('keydown', handleKeydown)
    })
  } else {
    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('contextmenu', handleClickOutsideContextMenu)
    document.removeEventListener('keydown', handleKeydown)
  }
})

// Separate handler for contextmenu to prevent immediate close
function handleClickOutsideContextMenu(event: MouseEvent): void {
  // Ignore if this event happens within 100ms of opening (same event that opened the menu)
  if (Date.now() - openTimestamp < 100) {
    return
  }
  // If menu ref is not available or click is outside the menu, close it
  if (!menuRef.value || !menuRef.value.contains(event.target as Node)) {
    close()
  }
}

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('contextmenu', handleClickOutsideContextMenu)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.context-menu {
  position: fixed;
  z-index: var(--z-popover);
  min-width: 180px;
  max-width: 280px;
  padding: var(--spacing-xs);
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.context-menu-divider {
  height: 1px;
  margin: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--color-separator);
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  text-align: left;
  transition: background-color var(--transition-fast);
}

.context-menu-item:hover:not(:disabled) {
  background-color: var(--color-accent-light);
}

.context-menu-item:active:not(:disabled) {
  background-color: var(--color-accent-lighter);
}

.context-menu-item-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.context-menu-item-danger {
  color: var(--color-error);
}

.context-menu-item-danger:hover:not(:disabled) {
  background-color: rgba(255, 59, 48, 0.1);
}

.context-menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.context-menu-icon svg {
  width: 100%;
  height: 100%;
}

.context-menu-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.context-menu-shortcut {
  flex-shrink: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* Context menu transitions */
.context-menu-enter-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.context-menu-leave-active {
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.context-menu-enter-from,
.context-menu-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
