<template>
  <ContextMenu
    :visible="visible"
    :x="x"
    :y="y"
    :items="menuItems"
    @update:visible="$emit('update:visible', $event)"
    @select="handleSelect"
    @close="$emit('close')"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ContextMenu from '../common/ContextMenu.vue'
import { useAuthStore } from '@/stores/auth'
import type { Photo, ContextMenuItem } from '@/types'

interface Props {
  visible?: boolean
  x?: number
  y?: number
  photo?: Photo | null
  selectionMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  x: 0,
  y: 0,
  photo: null,
  selectionMode: false
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'close': []
  'view': [photo: Photo]
  'download': [photo: Photo]
  'edit-tags': [photo: Photo]
  'delete': [photo: Photo]
  'multi-select': []
  'select': [photo: Photo]
}>()

const authStore = useAuthStore()

// Computed menu items based on permissions
const menuItems = computed((): ContextMenuItem[] => {
  if (!props.photo) return []
  
  const items: ContextMenuItem[] = []
  
  // Basic actions - available to all
  items.push({
    id: 'view',
    label: '放大查看',
    icon: 'zoom-in'
  })
  
  items.push({
    id: 'download',
    label: '下载图片',
    icon: 'download'
  })
  
  // Check if user can edit/delete
  const canEdit = authStore.isAdmin || 
    (authStore.isLoggedIn && props.photo.userId === authStore.currentUserId)
  
  if (canEdit) {
    items.push({ id: 'divider1', label: '', divider: true })
    
    items.push({
      id: 'edit-tags',
      label: '编辑标签',
      icon: 'tag'
    })
    
    items.push({
      id: 'delete',
      label: '删除图片',
      icon: 'trash',
      danger: true
    })
  }
  
  // Admin-only actions
  if (authStore.isAdmin && !props.selectionMode) {
    items.push({ id: 'divider2', label: '', divider: true })
    
    items.push({
      id: 'multi-select',
      label: '多选模式',
      icon: 'check-square'
    })
  }
  
  // Selection mode actions
  if (props.selectionMode) {
    // Clear existing items and show selection-specific items
    return [
      {
        id: 'select',
        label: '选中此图片',
        icon: 'check-square'
      },
      { id: 'divider3', label: '', divider: true },
      {
        id: 'view',
        label: '放大查看',
        icon: 'zoom-in'
      }
    ]
  }
  
  return items
})

// Handle menu item selection
function handleSelect(item: ContextMenuItem): void {
  if (!props.photo) return
  
  switch (item.id) {
    case 'view':
      emit('view', props.photo)
      break
    case 'download':
      emit('download', props.photo)
      break
    case 'edit-tags':
      emit('edit-tags', props.photo)
      break
    case 'delete':
      emit('delete', props.photo)
      break
    case 'multi-select':
      emit('multi-select')
      break
    case 'select':
      emit('select', props.photo)
      break
  }
}
</script>
