<template>
  <main class="main-content">
    <div class="content-body">
      <div v-if="authStore.loading" class="loading-placeholder"></div>
      <div v-else-if="isLocked" class="locked-state">
        <div class="locked-content">
          <div class="locked-icon">🔒</div>
          <h3>需要登录</h3>
          <p>请登录后查看照片墙</p>
          <button class="login-btn" @click="showLoginDialog">
            登录
          </button>
        </div>
      </div>
      <template v-else>
        <!-- Photo Waterfall -->
        <PhotoWaterfall
          :photos="photosStore.photos"
          :columns="settingsStore.columns"
          :loading="photosStore.loading"
          :has-more="photosStore.hasMore"
          :selectable="multiSelect.isSelectionMode.value"
          :selected-ids="multiSelect.selectedIds.value as number[]"
          :show-uploader="true"
          @load-more="handleLoadMore"
          @photo-click="handlePhotoClick"
          @photo-contextmenu="handlePhotoContextMenu"
          @photo-select="handlePhotoSelect"
          @photo-view="handlePhotoView"
        />

        <!-- Photo Context Menu -->
        <PhotoContextMenu
          v-model:visible="contextMenu.state.visible"
          :x="contextMenu.state.x"
          :y="contextMenu.state.y"
          :photo="contextMenu.state.targetData as Photo | null"
          :selection-mode="multiSelect.isSelectionMode.value"
          @view="handlePhotoView"
          @download="handleDownload"
          @edit-tags="handleEditTags"
          @delete="handleDelete"
          @multi-select="handleEnterMultiSelect"
          @select="handleSelectFromMenu"
        />

        <!-- Photo Viewer -->
        <PhotoViewer
          v-model="viewerVisible"
          :photos="photosStore.photos"
          :initial-index="viewerInitialIndex"
          @close="viewerVisible = false"
          @change="handleViewerChange"
        />
      </template>
    </div>

    <!-- Multi-select toolbar -->
    <Transition name="toolbar">
      <div v-if="multiSelect.isSelectionMode.value" class="selection-toolbar">
        <div class="toolbar-info">
          <span class="selection-count">已选择 {{ multiSelect.selectedCount.value }} 项</span>
        </div>
        <div class="toolbar-actions">
          <button
            class="btn btn-secondary"
            @click="multiSelect.toggleSelectAll"
          >
            {{ multiSelect.isAllSelected.value ? '取消全选' : '全选' }}
          </button>
          <button
            class="btn btn-secondary"
            :disabled="!multiSelect.hasSelection.value"
            @click="handleBatchEditTags"
          >
            编辑标签
          </button>
          <button
            class="btn btn-danger"
            :disabled="!multiSelect.hasSelection.value"
            @click="handleBatchDelete"
          >
            删除
          </button>
          <button
            class="btn btn-ghost"
            @click="multiSelect.exitSelectionMode"
          >
            取消
          </button>
        </div>
      </div>
    </Transition>
  </main>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { usePhotosStore } from '@/stores/photos'
import { useSettingsStore } from '@/stores/settings'
import { useConfigStore } from '@/stores/config'
import { useAuthStore } from '@/stores/auth'
import { useMultiSelect } from '@/composables/useMultiSelect'
import { useContextMenu } from '@/composables/useContextMenu'
import PhotoWaterfall from '../photo/PhotoWaterfall.vue'
import PhotoViewer from '../photo/PhotoViewer.vue'
import PhotoContextMenu from '../photo/PhotoContextMenu.vue'
import type { Photo } from '@/types'

const emit = defineEmits<{
  'edit-tags': [photo: Photo]
  'batch-edit-tags': [photos: Photo[]]
  'delete': [photo: Photo]
  'batch-delete': [photos: Photo[]]
  'login': []
}>()

const photosStore = usePhotosStore()
const settingsStore = useSettingsStore()
const configStore = useConfigStore()
const authStore = useAuthStore()

const isLocked = computed(() => configStore.config.forceLogin && !authStore.isLoggedIn)

// Context menu
const contextMenu = useContextMenu()

// Multi-select functionality
const multiSelect = useMultiSelect<Photo>({
  itemKey: 'id',
  onSelectionChange: (selection) => {
    console.log('Selection changed:', selection.count)
  }
})

// Photo viewer state
const viewerVisible = ref(false)
const viewerInitialIndex = ref(0)

// Update multi-select items when photos change
watch(() => photosStore.photos, (photos) => {
  multiSelect.setAllItems(photos)
}, { immediate: true })

// Fetch photos on settings change
watch(
  () => [settingsStore.selectedTags, settingsStore.sortBy],
  () => {
    fetchPhotos()
  },
  { deep: true }
)

// Load initial photos
onMounted(() => {
  fetchPhotos()
})

// Fetch photos with current filters
async function fetchPhotos(): Promise<void> {
  await photosStore.fetchPhotos({
    tags: settingsStore.selectedTags,
    sort: settingsStore.sortBy
  })
}

// Event handlers
function handleLoadMore(): void {
  photosStore.loadMore()
}

function handlePhotoClick(photo: Photo): void {
  handlePhotoView(photo)
}

function handlePhotoContextMenu(event: MouseEvent, photo: Photo): void {
  contextMenu.show(event, [], photo)
}

function handlePhotoSelect(photo: Photo, selected: boolean): void {
  if (selected) {
    multiSelect.select(photo)
  } else {
    multiSelect.deselect(photo)
  }
}

function handlePhotoView(photo: Photo): void {
  const index = photosStore.photos.findIndex(p => p.id === photo.id)
  viewerInitialIndex.value = index >= 0 ? index : 0
  viewerVisible.value = true
}

function handleViewerChange(_index: number, _photo: Photo): void {
  // Optional: preload adjacent images or update state
}

function handleDownload(photo: Photo): void {
  const link = document.createElement('a')
  if (!photo.url) return
  link.href = photo.url
  link.download = photo.originalName || `photo-${photo.id}`
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function handleEditTags(photo: Photo): void {
  emit('edit-tags', photo)
}

function handleDelete(photo: Photo): void {
  emit('delete', photo)
}

function handleEnterMultiSelect(): void {
  multiSelect.enterSelectionMode()
}

function handleSelectFromMenu(photo: Photo): void {
  multiSelect.select(photo)
}

function handleBatchEditTags(): void {
  const selectedPhotos = multiSelect.getSelectedItems()
  emit('batch-edit-tags', selectedPhotos)
}

function handleBatchDelete(): void {
  const selectedPhotos = multiSelect.getSelectedItems()
  emit('batch-delete', selectedPhotos)
}

// Show login dialog
function showLoginDialog(): void {
  emit('login')
}

// Expose methods for parent component
defineExpose({
  refresh: fetchPhotos,
  exitSelectionMode: () => multiSelect.exitSelectionMode()
})
</script>

<style scoped>
.main-content {
  position: relative;
  min-height: 100vh;
  background-color: var(--color-bg-primary);
  /* Leave space for floating sidebar on left */
  padding-left: calc(var(--sidebar-width) + var(--spacing-lg) * 2);
}

.content-body {
  min-height: 100vh;
  padding: var(--spacing-lg);
}

/* Selection toolbar */
.selection-toolbar {
  position: fixed;
  bottom: var(--spacing-lg);
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--z-sticky);
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  backdrop-filter: blur(12px);
}

.toolbar-info {
  padding-right: var(--spacing-md);
  border-right: 1px solid var(--color-separator);
}

.selection-count {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  white-space: nowrap;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

/* Toolbar transition */
.toolbar-enter-active,
.toolbar-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toolbar-enter-from,
.toolbar-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

/* Wider screens with expanded sidebar */
@media (min-width: 1400px) {
  .main-content {
    padding-left: calc(var(--sidebar-expanded-width) + var(--spacing-lg) * 2);
  }
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .main-content {
    padding-left: 0;
  }

  .content-body {
    padding: var(--spacing-md);
    /* Account for bottom navigation bar */
    padding-bottom: calc(var(--spacing-md) + 80px);
  }

  .selection-toolbar {
    bottom: calc(80px + var(--spacing-md));
    left: var(--spacing-md);
    right: var(--spacing-md);
    transform: none;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .toolbar-info {
    padding-right: 0;
    border-right: none;
    padding-bottom: var(--spacing-sm);
    border-bottom: 1px solid var(--color-separator);
    width: 100%;
    text-align: center;
  }

  .toolbar-actions {
    flex-wrap: wrap;
    justify-content: center;
  }

  .toolbar-enter-from,
  .toolbar-leave-to {
    transform: translateY(100%);
  }
}

.locked-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60vh;
  width: 100%;
}

.locked-content {
  text-align: center;
  color: var(--color-text-secondary);
}

.locked-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-md);
}

.locked-content h3 {
  font-size: 1.5rem;
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
}

.login-btn {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.login-btn:hover {
  background-color: var(--color-accent-hover);
  box-shadow: var(--shadow-hover);
}

.login-btn:active {
  background-color: var(--color-accent-active);
}

.loading-placeholder {
  height: 60vh;
  width: 100%;
}
</style>
