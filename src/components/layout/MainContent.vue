<template>
  <main class="main-content">
    <div class="content-body">
      <!-- Photo Waterfall -->
      <PhotoWaterfall
        :photos="photosStore.photos"
        :columns="settingsStore.columns"
        :loading="photosStore.loading"
        :has-more="photosStore.hasMore"
        :selectable="multiSelect.isSelectionMode.value"
        :selected-ids="multiSelect.selectedIds.value"
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
        :photo="contextMenu.state.targetData"
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

<script setup>
import { ref, watch, onMounted } from 'vue'
import { usePhotosStore } from '../../stores/photos.js'
import { useSettingsStore } from '../../stores/settings.js'
import { useMultiSelect } from '../../composables/useMultiSelect.js'
import { useContextMenu } from '../../composables/useContextMenu.js'
import PhotoWaterfall from '../photo/PhotoWaterfall.vue'
import PhotoViewer from '../photo/PhotoViewer.vue'
import PhotoContextMenu from '../photo/PhotoContextMenu.vue'

const emit = defineEmits(['edit-tags', 'batch-edit-tags', 'delete', 'batch-delete'])

const photosStore = usePhotosStore()
const settingsStore = useSettingsStore()

// Context menu
const contextMenu = useContextMenu()

// Multi-select functionality
const multiSelect = useMultiSelect({
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
async function fetchPhotos() {
  await photosStore.fetchPhotos({
    tags: settingsStore.selectedTags,
    sort: settingsStore.sortBy
  })
}

// Event handlers
function handleLoadMore() {
  photosStore.loadMore()
}

function handlePhotoClick(photo) {
  handlePhotoView(photo)
}

function handlePhotoContextMenu(event, photo) {
  contextMenu.show(event, [], photo)
}

function handlePhotoSelect(photo, selected) {
  if (selected) {
    multiSelect.select(photo)
  } else {
    multiSelect.deselect(photo)
  }
}

function handlePhotoView(photo) {
  const index = photosStore.photos.findIndex(p => p.id === photo.id)
  viewerInitialIndex.value = index >= 0 ? index : 0
  viewerVisible.value = true
}

function handleViewerChange(index, photo) {
  // Optional: preload adjacent images or update state
}

function handleDownload(photo) {
  const link = document.createElement('a')
  link.href = photo.url
  link.download = photo.originalName || `photo-${photo.id}`
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function handleEditTags(photo) {
  emit('edit-tags', photo)
}

function handleDelete(photo) {
  emit('delete', photo)
}

function handleEnterMultiSelect() {
  multiSelect.enterSelectionMode()
}

function handleSelectFromMenu(photo) {
  multiSelect.select(photo)
}

function handleBatchEditTags() {
  const selectedPhotos = multiSelect.getSelectedItems()
  emit('batch-edit-tags', selectedPhotos)
}

function handleBatchDelete() {
  const selectedPhotos = multiSelect.getSelectedItems()
  emit('batch-delete', selectedPhotos)
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
</style>
