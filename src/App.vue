<template>
  <div class="app">
    <!-- PWA Components -->
    <OfflineIndicator />
    <PWAInstallPrompt />
    <PWAUpdatePrompt />
    <Toast />
    
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
    <ImageUploadDialog
      v-model="dialogs.imageUpload"
      @success="handleUploadSuccess"
    />
    <BrowseSettingsDialog
      v-model="dialogs.browseSettings"
    />
    <FilterPhotosDialog
      v-model="dialogs.filterPhotos"
    />
    <ProfileDialog
      v-model="dialogs.profile"
    />
    <AccountSettingsDialog
      v-model="dialogs.accountSettings"
    />
    <SystemSettingsDialog
      v-model="dialogs.systemSettings"
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
      <!-- @vue-ignore -->
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

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import Sidebar from './components/layout/Sidebar.vue'
import MainContent from './components/layout/MainContent.vue'
import Modal from './components/common/Modal.vue'
import PWAInstallPrompt from './components/common/PWAInstallPrompt.vue'
import PWAUpdatePrompt from './components/common/PWAUpdatePrompt.vue'
import OfflineIndicator from './components/common/OfflineIndicator.vue'
import Toast from './components/common/Toast.vue'
import LoginDialog from './components/dialogs/LoginDialog.vue'
import ImageUploadDialog from './components/dialogs/ImageUploadDialog.vue'
import BrowseSettingsDialog from './components/dialogs/BrowseSettingsDialog.vue'
import FilterPhotosDialog from './components/dialogs/FilterPhotosDialog.vue'
import ProfileDialog from './components/dialogs/ProfileDialog.vue'
import AccountSettingsDialog from './components/dialogs/AccountSettingsDialog.vue'
import SystemSettingsDialog from './components/dialogs/SystemSettingsDialog.vue'
import TagEditDialog from './components/dialogs/TagEditDialog.vue'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/auth'
import { usePhotosStore } from '@/stores/photos'
import { useConfigStore } from '@/stores/config'
import photosApi from '@/api/photos'
import type { Photo } from '@/types'

// Initialize theme
const { initTheme } = useTheme()

// Stores
const authStore = useAuthStore()
const photosStore = usePhotosStore()
const configStore = useConfigStore()

// Component refs
const mainContentRef = ref<InstanceType<typeof MainContent> | null>(null)

// Dialog states
interface DialogStates {
  login: boolean
  imageUpload: boolean
  browseSettings: boolean
  filterPhotos: boolean
  profile: boolean
  accountSettings: boolean
  systemSettings: boolean
  tagEdit: boolean
  deleteConfirm: boolean
}

const dialogs = reactive<DialogStates>({
  login: false,
  imageUpload: false,
  browseSettings: false,
  filterPhotos: false,
  profile: false,
  accountSettings: false,
  systemSettings: false,
  tagEdit: false,
  deleteConfirm: false
})

// Tag edit state
const tagEditPhotos = ref<Photo[]>([])

// Delete state
const deleteTargetPhotos = ref<Photo[]>([])
const deleting = ref(false)

// Initialize app
onMounted(async () => {
  // Initialize theme
  initTheme()
  
  // Fetch system config
  configStore.fetchConfig()

  // Try to restore user session
  await authStore.fetchCurrentUser()
})

// Watch for force login requirement
watch(
  [() => configStore.config.forceLogin, () => authStore.isLoggedIn, () => authStore.loading],
  ([forceLogin, isLoggedIn, loading]) => {
    if (forceLogin && !isLoggedIn && !loading) {
      dialogs.login = true
    }
  },
  { immediate: true }
)

// Dialog handlers
type DialogName = 'login' | 'filter-photos' | 'account-settings' | 'system-settings' | 'image-upload'

const handleOpenDialog = (dialogName: DialogName): void => {
  switch (dialogName) {
    case 'login':
      dialogs.login = true
      break
    case 'image-upload':
      dialogs.imageUpload = true
      break
    case 'filter-photos':
      dialogs.filterPhotos = true
      break
    case 'account-settings':
      dialogs.accountSettings = true
      break
    case 'system-settings':
      dialogs.systemSettings = true
      break
  }
}

// Login success handler
const handleLoginSuccess = (): void => {
  // Refresh photos to show user-specific content
  photosStore.fetchPhotos()
}

const handleUploadSuccess = (): void => {
  // Refresh photos to show newly uploaded content
  photosStore.fetchPhotos()
}

// Photo action handlers
const handleEditTags = (photo: Photo): void => {
  tagEditPhotos.value = [photo]
  dialogs.tagEdit = true
}

const handleBatchEditTags = (photos: Photo[]): void => {
  tagEditPhotos.value = photos
  dialogs.tagEdit = true
}

const handleTagEditSuccess = (): void => {
  // Refresh photos to show updated tags
  photosStore.fetchPhotos()
  // Clear multi-select in main content if it exists
  if (mainContentRef.value?.exitSelectionMode) {
    mainContentRef.value.exitSelectionMode()
  }
}

const handleDelete = (photo: Photo): void => {
  deleteTargetPhotos.value = [photo]
  dialogs.deleteConfirm = true
}

const handleBatchDelete = (photos: Photo[]): void => {
  deleteTargetPhotos.value = photos
  dialogs.deleteConfirm = true
}

const confirmDelete = async (): Promise<void> => {
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
    if (mainContentRef.value?.exitSelectionMode) {
      mainContentRef.value.exitSelectionMode()
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
