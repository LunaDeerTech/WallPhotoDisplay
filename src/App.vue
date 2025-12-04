<template>
  <div class="app">
    <MainContent
      ref="mainContentRef"
      @edit-tags="handleEditTags"
      @batch-edit-tags="handleBatchEditTags"
      @delete="handleDelete"
      @batch-delete="handleBatchDelete"
    />
    <Sidebar @open-dialog="handleOpenDialog" />
    
    <!-- Global dialogs will be added here -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Sidebar from './components/layout/Sidebar.vue'
import MainContent from './components/layout/MainContent.vue'
import { useTheme } from './composables/useTheme.js'
import { useAuthStore } from './stores/auth.js'

// Initialize theme
const { initTheme } = useTheme()

// Auth store for restoring login state
const authStore = useAuthStore()

// Component refs
const mainContentRef = ref(null)

// Initialize app
onMounted(async () => {
  // Initialize theme
  initTheme()
  
  // Try to restore user session
  await authStore.fetchCurrentUser()
})

// Dialog handlers
const handleOpenDialog = (dialogName) => {
  console.log('Open dialog:', dialogName)
  // Dialog handling will be implemented in next phase
}

// Photo action handlers
const handleEditTags = (photo) => {
  console.log('Edit tags for photo:', photo.id)
  // Will open TagEditDialog in next phase
}

const handleBatchEditTags = (photos) => {
  console.log('Batch edit tags for photos:', photos.map(p => p.id))
  // Will open TagEditDialog in next phase
}

const handleDelete = (photo) => {
  console.log('Delete photo:', photo.id)
  // Will show confirmation dialog in next phase
}

const handleBatchDelete = (photos) => {
  console.log('Batch delete photos:', photos.map(p => p.id))
  // Will show confirmation dialog in next phase
}
</script>

<style scoped>
.app {
  position: relative;
  min-height: 100vh;
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
}
</style>
