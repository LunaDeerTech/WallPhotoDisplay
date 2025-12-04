<template>
  <div class="app">
    <!-- PWA Components -->
    <OfflineIndicator />
    <PWAInstallPrompt />
    <PWAUpdatePrompt />
    
    <MainContent
      ref="mainContentRef"
      @edit-tags="handleEditTags"
      @batch-edit-tags="handleBatchEditTags"
      @delete="handleDelete"
      @batch-delete="handleBatchDelete"
    />
    <Sidebar @open-dialog="handleOpenDialog" />
    
    <!-- Global dialogs -->
    <LoginDialog
      v-model="dialogs.login"
      @success="handleLoginSuccess"
    />
    <BrowseSettingsDialog
      v-model="dialogs.browseSettings"
    />
    <PhotoManageDialog
      v-model="dialogs.photoManage"
    />
    <ProfileDialog
      v-model="dialogs.profile"
    />
    <UserManageDialog
      v-model="dialogs.userManage"
    />
    <TagEditDialog
      v-model="dialogs.tagEdit"
      :photos="tagEditPhotos"
      @success="handleTagEditSuccess"
    />
    
    <!-- Delete confirmation dialog -->
    <Modal
      v-model="dialogs.deleteConfirm"
      title="确认删除"
      size="sm"
    >
      <p class="confirm-message">
        确定要删除{{ deleteTargetPhotos.length > 1 ? `这 ${deleteTargetPhotos.length} 张图片` : '这张图片' }}吗？此操作不可撤销。
      </p>
      <template #footer>
        <div class="dialog-actions">
          <button type="button" class="btn btn-secondary" @click="dialogs.deleteConfirm = false">
            取消
          </button>
          <button type="button" class="btn btn-danger" @click="confirmDelete" :disabled="deleting">
            {{ deleting ? '删除中...' : '删除' }}
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import Sidebar from './components/layout/Sidebar.vue'
import MainContent from './components/layout/MainContent.vue'
import Modal from './components/common/Modal.vue'
import PWAInstallPrompt from './components/common/PWAInstallPrompt.vue'
import PWAUpdatePrompt from './components/common/PWAUpdatePrompt.vue'
import OfflineIndicator from './components/common/OfflineIndicator.vue'
import LoginDialog from './components/dialogs/LoginDialog.vue'
import BrowseSettingsDialog from './components/dialogs/BrowseSettingsDialog.vue'
import PhotoManageDialog from './components/dialogs/PhotoManageDialog.vue'
import ProfileDialog from './components/dialogs/ProfileDialog.vue'
import UserManageDialog from './components/dialogs/UserManageDialog.vue'
import TagEditDialog from './components/dialogs/TagEditDialog.vue'
import { useTheme } from './composables/useTheme.js'
import { useAuthStore } from './stores/auth.js'
import { usePhotosStore } from './stores/photos.js'
import photosApi from './api/photos.js'

// Initialize theme
const { initTheme } = useTheme()

// Stores
const authStore = useAuthStore()
const photosStore = usePhotosStore()

// Component refs
const mainContentRef = ref(null)

// Dialog states
const dialogs = reactive({
  login: false,
  browseSettings: false,
  photoManage: false,
  profile: false,
  userManage: false,
  tagEdit: false,
  deleteConfirm: false
})

// Tag edit state
const tagEditPhotos = ref([])

// Delete state
const deleteTargetPhotos = ref([])
const deleting = ref(false)

// Initialize app
onMounted(async () => {
  // Initialize theme
  initTheme()
  
  // Try to restore user session
  await authStore.fetchCurrentUser()
})

// Dialog handlers
const handleOpenDialog = (dialogName) => {
  switch (dialogName) {
    case 'login':
      dialogs.login = true
      break
    case 'browse-settings':
      dialogs.browseSettings = true
      break
    case 'photo-manage':
      dialogs.photoManage = true
      break
    case 'profile':
      dialogs.profile = true
      break
    case 'user-manage':
      dialogs.userManage = true
      break
  }
}

// Login success handler
const handleLoginSuccess = () => {
  // Refresh photos to show user-specific content
  photosStore.fetchPhotos()
}

// Photo action handlers
const handleEditTags = (photo) => {
  tagEditPhotos.value = [photo]
  dialogs.tagEdit = true
}

const handleBatchEditTags = (photos) => {
  tagEditPhotos.value = photos
  dialogs.tagEdit = true
}

const handleTagEditSuccess = () => {
  // Refresh photos to show updated tags
  photosStore.fetchPhotos()
  // Clear multi-select in main content if it exists
  if (mainContentRef.value?.clearMultiSelect) {
    mainContentRef.value.clearMultiSelect()
  }
}

const handleDelete = (photo) => {
  deleteTargetPhotos.value = [photo]
  dialogs.deleteConfirm = true
}

const handleBatchDelete = (photos) => {
  deleteTargetPhotos.value = photos
  dialogs.deleteConfirm = true
}

const confirmDelete = async () => {
  if (deleteTargetPhotos.value.length === 0 || deleting.value) return
  
  deleting.value = true
  
  try {
    const ids = deleteTargetPhotos.value.map(p => p.id)
    
    if (ids.length === 1) {
      await photosApi.deletePhoto(ids[0])
    } else {
      await photosApi.batchDeletePhotos(ids)
    }
    
    // Refresh photos
    await photosStore.fetchPhotos()
    
    dialogs.deleteConfirm = false
    deleteTargetPhotos.value = []
    
    // Clear multi-select in main content
    if (mainContentRef.value?.clearMultiSelect) {
      mainContentRef.value.clearMultiSelect()
    }
  } catch (error) {
    console.error('Delete photos error:', error)
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.app {
  position: relative;
  min-height: 100vh;
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
}

.confirm-message {
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
  line-height: var(--line-height-normal);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-bg-tertiary);
}

.btn-danger {
  background-color: var(--color-error);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #cc2929;
}
</style>
