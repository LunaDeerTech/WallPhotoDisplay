<template>
  <div class="photo-review">
    <div class="header-row">
      <h3 class="section-title">图片审核</h3>
      
      <div class="toolbar" v-if="photos.length > 0">
        <template v-if="!isSelectionMode">
          <button class="btn btn-secondary btn-sm" @click="enterSelectionMode">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            批量处理
          </button>
        </template>
        <template v-else>
          <span class="selected-count">已选 {{ selectedCount }} 张</span>
          <button 
            class="btn btn-reject btn-sm" 
            @click="handleBatchReview('reject')"
            :disabled="selectedCount === 0 || processingBatch"
          >
            批量拒绝
          </button>
          <button 
            class="btn btn-approve btn-sm" 
            @click="handleBatchReview('approve')"
            :disabled="selectedCount === 0 || processingBatch"
          >
            批量通过
          </button>
          <button class="btn btn-secondary btn-sm" @click="exitSelectionMode">取消</button>
        </template>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <span>加载中...</span>
    </div>

    <div v-else-if="photos.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <p>暂无待审核图片</p>
    </div>

    <div v-else class="review-grid">
      <div 
        v-for="photo in photos" 
        :key="photo.id" 
        class="review-card"
        :class="{ 'is-selected': isSelected(photo.id) }"
        @click="handleCardClick(photo)"
      >
        <div class="review-image-wrapper">
          <img :src="photo.thumbnailUrl || photo.url" :alt="photo.originalName" loading="lazy" />
          
          <!-- Selection Overlay -->
          <div v-if="isSelectionMode" class="selection-overlay">
            <div class="checkbox" :class="{ checked: isSelected(photo.id) }">
              <svg v-if="isSelected(photo.id)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </div>

          <div class="review-info-overlay">
            <div class="info-row">
              <span class="info-label">上传者:</span>
              <span class="info-value">{{ photo.uploaderName }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">时间:</span>
              <span class="info-value">{{ formatDateTime(photo.createdAt) }}</span>
            </div>
            <div class="info-row" v-if="photo.tags && photo.tags.length">
              <span class="info-label">标签:</span>
              <div class="tags-list">
                <span v-for="tag in photo.tags" :key="tag.id" class="tag-badge">#{{ tag.name }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="review-actions" v-if="!isSelectionMode">
          <button 
            class="btn btn-reject" 
            @click.stop="handleReview(photo, 'reject')"
            :disabled="processingId === photo.id"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            拒绝
          </button>
          <button 
            class="btn btn-approve" 
            @click.stop="handleReview(photo, 'approve')"
            :disabled="processingId === photo.id"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            通过
          </button>
        </div>
      </div>
    </div>
    
    <!-- Pagination if needed, for now simple load more or just list -->
    <div v-if="hasMore" class="load-more">
      <button class="btn btn-secondary" @click="loadMore" :disabled="loadingMore">
        {{ loadingMore ? '加载中...' : '加载更多' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import photosApi from '@/api/photos'
import type { Photo } from '@/types'
import { useToast } from '@/composables/useToast'
import { formatDateTime } from '@/utils/helpers'
import { useMultiSelect } from '@/composables/useMultiSelect'

const photos = ref<Photo[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const processingId = ref<number | null>(null)
const processingBatch = ref(false)
const page = ref(1)
const hasMore = ref(false)
const toast = useToast()

const {
  isSelectionMode,
  selectedIds,
  selectedCount,
  isSelected,
  toggleSelect,
  enterSelectionMode,
  exitSelectionMode
} = useMultiSelect<Photo>()

async function fetchPhotos(isLoadMore = false) {
  if (isLoadMore) {
    loadingMore.value = true
  } else {
    loading.value = true
  }

  try {
    const res = await photosApi.getPendingPhotos({ page: page.value, limit: 20 })
    if (res.success && res.data) {
      if (isLoadMore) {
        photos.value.push(...res.data.photos)
      } else {
        photos.value = res.data.photos
      }
      hasMore.value = page.value < res.data.pagination.totalPages
    }
  } catch (error) {
    toast.error('获取待审核图片失败')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function loadMore() {
  page.value++
  fetchPhotos(true)
}

function handleCardClick(photo: Photo) {
  if (isSelectionMode.value) {
    toggleSelect(photo)
  }
}

async function handleReview(photo: Photo, action: 'approve' | 'reject') {
  processingId.value = photo.id
  try {
    const res = await photosApi.reviewPhoto(photo.id, action)
    if (res.success) {
      toast.success(action === 'approve' ? '已通过' : '已拒绝')
      // Remove from list
      photos.value = photos.value.filter(p => p.id !== photo.id)
    } else {
      toast.error('操作失败')
    }
  } catch (error) {
    toast.error('操作失败')
  } finally {
    processingId.value = null
  }
}

async function handleBatchReview(action: 'approve' | 'reject') {
  if (selectedCount.value === 0) return
  
  processingBatch.value = true
  const ids = selectedIds.value.map(id => Number(id))
  
  try {
    const res = await photosApi.batchReviewPhotos(ids, action)
    if (res.success) {
      toast.success(`已批量${action === 'approve' ? '通过' : '拒绝'} ${res.data?.count ?? 0} 张图片`)
      // Remove processed photos
      const processedIds = new Set(ids)
      photos.value = photos.value.filter(p => !processedIds.has(p.id))
      exitSelectionMode()
    } else {
      toast.error('批量操作失败')
    }
  } catch (error) {
    toast.error('批量操作失败')
  } finally {
    processingBatch.value = false
  }
}

onMounted(() => {
  fetchPhotos()
})
</script>

<style scoped>
.photo-review {
  max-width: 1000px;
  margin: 0 auto;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-primary);
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xxl);
  color: var(--color-text-tertiary);
  gap: var(--spacing-md);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon svg {
  width: 48px;
  height: 48px;
  opacity: 0.5;
}

.review-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  align-items: start;
}

.review-card {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}

.review-image-wrapper {
  position: relative;
  background: var(--color-bg-tertiary);
}

.review-image-wrapper img {
  width: 100%;
  height: auto;
  display: block;
}

.review-info-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--spacing-md);
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
  color: white;
  font-size: var(--font-size-sm);
}

.info-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: 4px;
}

.info-label {
  opacity: 0.8;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-badge {
  background: rgba(255,255,255,0.2);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.review-actions {
  padding: var(--spacing-md);
  display: flex;
  gap: var(--spacing-md);
  background: var(--color-bg-elevated);
}

.btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn svg {
  width: 18px;
  height: 18px;
}

.btn-reject {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
}

.btn-reject:hover:not(:disabled) {
  background: rgba(244, 67, 54, 0.2);
}

.btn-approve {
  background: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}

.btn-approve:hover:not(:disabled) {
  background: rgba(76, 175, 80, 0.2);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.load-more {
  margin-top: var(--spacing-xl);
  text-align: center;
}

.btn-secondary {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  padding: var(--spacing-sm) var(--spacing-xl);
}

/* New Styles for Batch Selection */
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.header-row .section-title {
  margin-bottom: 0;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.selected-count {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: 500;
}

.btn-sm {
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: var(--font-size-sm);
  flex: initial;
}

.review-card {
  position: relative;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  cursor: default;
}

.review-card.is-selected {
  box-shadow: 0 0 0 2px var(--color-accent);
  transform: translateY(-2px);
}

.selection-overlay {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  z-index: 10;
}

.checkbox {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.8);
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  cursor: pointer;
}

.checkbox.checked {
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.checkbox svg {
  width: 16px;
  height: 16px;
  color: white;
}

/* Hover effect for selection mode */
.review-card:hover .checkbox {
  border-color: white;
  background: rgba(0, 0, 0, 0.4);
}

.review-card:hover .checkbox.checked {
  background: var(--color-accent);
  border-color: var(--color-accent);
}
</style>
