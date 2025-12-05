<template>
  <div class="photo-manage-content">
    <!-- Toolbar -->
    <div class="toolbar">
      <template v-if="!isMultiSelectMode">
        <button
          type="button"
          class="toolbar-btn primary"
          @click="showUploadDialog = true"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span>上传图片</span>
        </button>

        <div class="toolbar-divider" />

        <!-- Tag filter dropdown -->
        <div class="filter-dropdown" ref="filterDropdownRef">
          <button
            type="button"
            class="toolbar-btn"
            :class="{ active: filterTags.length > 0 }"
            @click="showFilterDropdown = !showFilterDropdown"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            <span>筛选{{ filterTags.length > 0 ? ` (${filterTags.length})` : '' }}</span>
          </button>
          <Transition name="dropdown">
            <div v-if="showFilterDropdown" class="filter-panel">
              <TagSelector
                v-model:selectedTags="filterTags"
                mode="all"
                :limit="15"
                :show-search="true"
                :show-count="true"
                empty-text="暂无标签"
              />
            </div>
          </Transition>
        </div>
      </template>

      <div class="toolbar-spacer" />

      <!-- Multi-select toggle -->
      <button
        v-if="!isMultiSelectMode"
        type="button"
        class="toolbar-btn"
        @click="enterMultiSelectMode"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 11 12 14 22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        <span>多选</span>
      </button>

      <!-- Multi-select actions -->
      <template v-else>
        <span class="selected-count">已选择 {{ selectedPhotos.length }} 张</span>
        <button
          type="button"
          class="toolbar-btn"
          :disabled="selectedPhotos.length === 0"
          @click="handleBatchEditTags"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
          <span>编辑标签</span>
        </button>
        <button
          type="button"
          class="toolbar-btn danger"
          :disabled="selectedPhotos.length === 0"
          @click="handleBatchDelete"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          <span>删除</span>
        </button>
        <button
          type="button"
          class="toolbar-btn"
          @click="exitMultiSelectMode"
        >
          取消
        </button>
      </template>
    </div>

    <!-- Photos grid -->
    <div class="photos-container" ref="photosContainerRef" @scroll="handleScroll">
      <div v-if="loading && photos.length === 0" class="loading-state">
        <svg class="spinner" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3"/>
        </svg>
        <span>加载中...</span>
      </div>

      <div v-else-if="photos.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <p>暂无图片</p>
        <button type="button" class="btn btn-primary" @click="showUploadDialog = true">
          上传图片
        </button>
      </div>

      <div v-else class="photos-grid">
        <div
          v-for="photo in photos"
          :key="photo.id"
          class="photo-item"
          :class="{ selected: isPhotoSelected(photo.id) }"
          @click="handlePhotoClick(photo)"
          @contextmenu.prevent="handlePhotoContextMenu($event, photo)"
        >
          <img
            :src="photo.thumbnailUrl || photo.url"
            :alt="photo.originalName"
            loading="lazy"
          />
          <div v-if="isMultiSelectMode" class="photo-checkbox">
            <svg v-if="isPhotoSelected(photo.id)" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </div>
          <div class="photo-overlay">
            <span class="photo-name">{{ photo.originalName }}</span>
          </div>
        </div>
      </div>

      <div v-if="loading && photos.length > 0" class="loading-more">
        <svg class="spinner" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3"/>
        </svg>
      </div>
    </div>

    <!-- Context menu -->
    <ContextMenu
      :visible="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :items="contextMenuItems"
      @update:visible="contextMenu.visible = $event"
      @select="handleContextMenuSelect"
    />

    <!-- Photo viewer -->
    <PhotoViewer
      v-model="showViewer"
      :photos="viewingPhoto ? [viewingPhoto] : []"
    />

    <!-- Tag edit dialog -->
    <TagEditDialog
      v-model="showTagEdit"
      :photos="tagEditPhotos"
      @success="handleTagEditSuccess"
    />

    <!-- Upload dialog -->
    <ImageUploadDialog
      v-model="showUploadDialog"
      @success="handleUploadSuccess"
    />

    <!-- Delete confirmation -->
    <Modal
      v-model="showDeleteConfirm"
      title="确认删除"
      size="sm"
    >
      <p class="confirm-message">
        确定要删除{{ deleteTargetPhotos.length > 1 ? `这 ${deleteTargetPhotos.length} 张图片` : '这张图片' }}吗？此操作不可撤销。
      </p>
      <!-- @vue-ignore -->
      <template #footer>
        <div class="dialog-actions">
          <button type="button" class="btn btn-secondary" @click="showDeleteConfirm = false">
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import Modal from '../common/Modal.vue'
import TagSelector from '../common/TagSelector.vue'
import ContextMenu from '../common/ContextMenu.vue'
import PhotoViewer from '../photo/PhotoViewer.vue'
import TagEditDialog from '../dialogs/TagEditDialog.vue'
import ImageUploadDialog from '../dialogs/ImageUploadDialog.vue'
import photosApi from '@/api/photos'
import type { Photo, ContextMenuItem } from '@/types'

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  targetPhoto: Photo | null
}

const photos = ref<Photo[]>([])
const loading = ref(false)
const pagination = ref<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
const filterTags = ref<string[]>([])
const showFilterDropdown = ref(false)
const filterDropdownRef = ref<HTMLElement | null>(null)

// Multi-select state
const isMultiSelectMode = ref(false)
const selectedPhotos = ref<Photo[]>([])

// Context menu state
const contextMenu = ref<ContextMenuState>({
  visible: false,
  x: 0,
  y: 0,
  targetPhoto: null
})

// Dialog states
const showViewer = ref(false)
const viewingPhoto = ref<Photo | null>(null)
const showTagEdit = ref(false)
const tagEditPhotos = ref<Photo[]>([])
const showUploadDialog = ref(false)
const showDeleteConfirm = ref(false)
const deleteTargetPhotos = ref<Photo[]>([])
const deleting = ref(false)

// Refs
const photosContainerRef = ref<HTMLElement | null>(null)

// Computed
const hasMore = computed(() => pagination.value.page < pagination.value.totalPages)

const contextMenuItems = computed((): ContextMenuItem[] => {
  const items: ContextMenuItem[] = [
    { id: 'view', label: '放大查看', icon: 'zoom-in' },
    { id: 'edit-tags', label: '编辑标签', icon: 'tag' },
    { id: 'divider1', label: '', divider: true },
    { id: 'delete', label: '删除', icon: 'trash', danger: true }
  ]
  
  if (!isMultiSelectMode.value) {
    items.splice(2, 0, { id: 'multi-select', label: '多选', icon: 'check-square' })
  }
  
  return items
})

// Watch for filter changes
watch(filterTags, async () => {
  pagination.value.page = 1
  await fetchPhotos()
}, { deep: true })

// Lifecycle
onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  await fetchPhotos()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function handleClickOutside(event: MouseEvent): void {
  if (filterDropdownRef.value && !filterDropdownRef.value.contains(event.target as Node)) {
    showFilterDropdown.value = false
  }
}

// Fetch photos
async function fetchPhotos(): Promise<void> {
  loading.value = true
  
  try {
    const params: { page: number; limit: number; tags?: string } = {
      page: pagination.value.page,
      limit: pagination.value.limit
    }
    
    if (filterTags.value.length > 0) {
      params.tags = filterTags.value.join(',')
    }
    
    const response = await photosApi.getMyPhotos(params)
    
    if (response.success && response.data) {
      if (pagination.value.page === 1) {
        photos.value = response.data.photos
      } else {
        photos.value = [...photos.value, ...response.data.photos]
      }
      pagination.value = response.data.pagination
    }
  } catch (error) {
    console.error('Fetch photos error:', error)
  } finally {
    loading.value = false
  }
}

// Load more on scroll
async function handleScroll(): Promise<void> {
  if (!hasMore.value || loading.value) return
  
  const container = photosContainerRef.value
  if (!container) return
  
  const { scrollTop, scrollHeight, clientHeight } = container
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    pagination.value.page++
    await fetchPhotos()
  }
}

// Multi-select
function enterMultiSelectMode(): void {
  isMultiSelectMode.value = true
  selectedPhotos.value = []
}

function exitMultiSelectMode(): void {
  isMultiSelectMode.value = false
  selectedPhotos.value = []
}

function isPhotoSelected(photoId: number): boolean {
  return selectedPhotos.value.some(p => p.id === photoId)
}

function togglePhotoSelection(photo: Photo): void {
  const index = selectedPhotos.value.findIndex(p => p.id === photo.id)
  if (index === -1) {
    selectedPhotos.value.push(photo)
  } else {
    selectedPhotos.value.splice(index, 1)
  }
}

// Photo click
function handlePhotoClick(photo: Photo): void {
  if (isMultiSelectMode.value) {
    togglePhotoSelection(photo)
  } else {
    viewingPhoto.value = photo
    showViewer.value = true
  }
}

// Context menu
function handlePhotoContextMenu(event: MouseEvent, photo: Photo): void {
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    targetPhoto: photo
  }
}

function handleContextMenuSelect(item: ContextMenuItem): void {
  const photo = contextMenu.value.targetPhoto
  contextMenu.value.visible = false
  
  if (!photo) return
  
  switch (item.id) {
    case 'view':
      viewingPhoto.value = photo
      showViewer.value = true
      break
    case 'edit-tags':
      tagEditPhotos.value = [photo]
      showTagEdit.value = true
      break
    case 'multi-select':
      enterMultiSelectMode()
      togglePhotoSelection(photo)
      break
    case 'delete':
      deleteTargetPhotos.value = [photo]
      showDeleteConfirm.value = true
      break
  }
}

// Batch operations
function handleBatchEditTags(): void {
  tagEditPhotos.value = [...selectedPhotos.value]
  showTagEdit.value = true
}

function handleBatchDelete(): void {
  deleteTargetPhotos.value = [...selectedPhotos.value]
  showDeleteConfirm.value = true
}

// Delete confirmation
async function confirmDelete(): Promise<void> {
  if (deleteTargetPhotos.value.length === 0) return
  
  deleting.value = true
  
  try {
    const ids = deleteTargetPhotos.value.map(p => p.id)
    
    if (ids.length === 1) {
      await photosApi.deletePhoto(ids[0])
    } else {
      await photosApi.batchDeletePhotos(ids)
    }
    
    // Remove deleted photos from local state
    photos.value = photos.value.filter(p => !ids.includes(p.id))
    selectedPhotos.value = selectedPhotos.value.filter(p => !ids.includes(p.id))
    
    showDeleteConfirm.value = false
    deleteTargetPhotos.value = []
  } catch (error) {
    console.error('Delete photos error:', error)
  } finally {
    deleting.value = false
  }
}

// Success handlers
function handleTagEditSuccess(): void {
  // Refresh photos to get updated tags
  pagination.value.page = 1
  fetchPhotos()
  exitMultiSelectMode()
}

function handleUploadSuccess(): void {
  // Refresh photos
  pagination.value.page = 1
  fetchPhotos()
}
</script>

<style scoped>
.photo-manage-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 400px;
}

/* Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-md);
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toolbar-btn:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-btn.primary {
  background-color: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
}

.toolbar-btn.primary:hover:not(:disabled) {
  background-color: var(--color-accent-hover);
  border-color: var(--color-accent-hover);
  color: white;
}

.toolbar-btn.danger {
  color: var(--color-error);
  border-color: var(--color-error);
}

.toolbar-btn.danger:hover:not(:disabled) {
  background-color: var(--color-error);
  color: white;
}

.toolbar-btn.active {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background-color: var(--color-accent-light);
}

.toolbar-btn svg {
  width: 18px;
  height: 18px;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background-color: var(--color-border);
}

.toolbar-spacer {
  flex: 1;
}

.selected-count {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-right: var(--spacing-sm);
}

/* Filter dropdown */
.filter-dropdown {
  position: relative;
}

.filter-panel {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: var(--spacing-sm);
  width: 320px;
  max-height: 400px;
  padding: var(--spacing-md);
  background-color: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  z-index: var(--z-dropdown);
  overflow-y: auto;
}

/* Photos container */
.photos-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-sm);
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--spacing-md);
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.photo-item:hover {
  transform: scale(1.02);
  box-shadow: var(--shadow-lg);
}

.photo-item.selected {
  outline: 3px solid var(--color-accent);
  outline-offset: 2px;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-checkbox {
  position: absolute;
  top: var(--spacing-sm);
  left: var(--spacing-sm);
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  background-color: var(--color-bg-primary);
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.photo-item.selected .photo-checkbox {
  background-color: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
}

.photo-checkbox svg {
  width: 16px;
  height: 16px;
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--spacing-sm);
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.photo-item:hover .photo-overlay {
  opacity: 1;
}

.photo-name {
  font-size: var(--font-size-xs);
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Loading / Empty states */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  height: 100%;
  color: var(--color-text-secondary);
}

.loading-state svg,
.empty-state svg {
  width: 64px;
  height: 64px;
  opacity: 0.5;
}

.spinner {
  animation: spin 1s linear infinite;
}

.spinner circle {
  stroke-dasharray: 60;
  stroke-dashoffset: 45;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

.loading-more {
  display: flex;
  justify-content: center;
  padding: var(--spacing-lg);
}

.loading-more svg {
  width: 24px;
  height: 24px;
  color: var(--color-text-secondary);
}

/* Confirm dialog */
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
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-primary {
  background-color: var(--color-accent);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-accent-hover);
}

.btn-secondary {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.btn-secondary:hover {
  background-color: var(--color-bg-tertiary);
}

.btn-danger {
  background-color: var(--color-error);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #cc2929;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all var(--transition-fast);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
