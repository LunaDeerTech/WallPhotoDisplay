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

<script setup>
import { computed } from 'vue'
import ContextMenu from '../common/ContextMenu.vue'
import { useAuthStore } from '../../stores/auth.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  x: {
    type: Number,
    default: 0
  },
  y: {
    type: Number,
    default: 0
  },
  photo: {
    type: Object,
    default: null
  },
  selectionMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:visible',
  'close',
  'view',
  'download',
  'edit-tags',
  'delete',
  'multi-select',
  'select'
])

const authStore = useAuthStore()

// Computed menu items based on permissions
const menuItems = computed(() => {
  if (!props.photo) return []
  
  const items = []
  
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
    items.push({ divider: true })
    
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
    items.push({ divider: true })
    
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
      { divider: true },
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
function handleSelect(item) {
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
