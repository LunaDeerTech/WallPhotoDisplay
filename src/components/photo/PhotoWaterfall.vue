<template>
  <div class="photo-waterfall-container" ref="containerRef">
    <!-- Loading state -->
    <div v-if="loading && photos.length === 0" class="waterfall-loading">
      <div class="loading-grid" :style="{ gridTemplateColumns: `repeat(${columns}, 1fr)` }">
        <div
          v-for="i in columns * 2"
          :key="`skeleton-${i}`"
          class="loading-skeleton"
          :style="{ animationDelay: `${i * 0.1}s` }"
        />
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="photos.length === 0" class="waterfall-empty">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      </div>
      <h3 class="empty-title">暂无图片</h3>
      <p class="empty-description">{{ emptyText }}</p>
    </div>

    <!-- Waterfall grid -->
    <div
      v-else
      class="waterfall-grid"
      ref="gridRef"
      :style="{ height: `${containerHeight}px` }"
    >
      <div
        v-for="photo in photos"
        :key="photo.id"
        class="waterfall-item"
        :data-id="photo.id"
        :style="getItemStyle(photo)"
      >
        <PhotoCard
          :photo="photo"
          :selectable="selectable"
          :selected="isSelected(photo.id)"
          :show-info="showInfo"
          :show-uploader="showUploader"
          @click="handlePhotoClick(photo)"
          @contextmenu="handlePhotoContextMenu"
          @select="handlePhotoSelect"
          @view="handlePhotoView"
          @image-load="handleImageLoad(photo)"
          @like="handlePhotoLike"
        />
      </div>
    </div>

    <!-- Load more trigger -->
    <div
      v-if="photos.length > 0"
      ref="loadMoreTrigger"
      class="load-more-trigger"
    >
      <div v-if="loading" class="load-more-spinner">
        <div class="spinner" />
        <span>加载中...</span>
      </div>
      <div v-else-if="!hasMore" class="no-more">
        <span>已加载全部</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import PhotoCard from './PhotoCard.vue'
import type { Photo } from '@/types'

interface ItemPosition {
  x: number
  y: number
  width: number
  height: number
  columnIndex: number
}

interface Props {
  photos?: Photo[]
  columns?: number
  gap?: number
  loading?: boolean
  hasMore?: boolean
  selectable?: boolean
  selectedIds?: number[]
  showInfo?: boolean
  showUploader?: boolean
  emptyText?: string
}

const props = withDefaults(defineProps<Props>(), {
  photos: () => [],
  columns: 4,
  gap: 16,
  loading: false,
  hasMore: true,
  selectable: false,
  selectedIds: () => [],
  showInfo: true,
  showUploader: false,
  emptyText: '试试上传一些照片吧'
})

const emit = defineEmits<{
  'load-more': []
  'photo-click': [photo: Photo]
  'photo-contextmenu': [event: MouseEvent, photo: Photo]
  'photo-select': [photo: Photo, selected: boolean]
  'photo-view': [photo: Photo]
  'photo-like': [photo: Photo]
}>()

// Refs
const gridRef = ref<HTMLElement | null>(null)
const loadMoreTrigger = ref<HTMLElement | null>(null)

// State
const columnHeights = ref<number[]>([])
const itemPositions = ref<Map<number, ItemPosition>>(new Map())
const containerHeight = ref(0)
const columnWidth = ref(0)

// Initialize column heights
function initColumnHeights(): void {
  columnHeights.value = new Array(props.columns).fill(0)
}

// Get shortest column index
function getShortestColumnIndex(): number {
  if (columnHeights.value.length === 0) return 0
  const minHeight = Math.min(...columnHeights.value)
  return columnHeights.value.indexOf(minHeight)
}

// Calculate column width
function calculateColumnWidth(): number {
  if (!gridRef.value) return 0
  const gridWidth = gridRef.value.clientWidth
  const totalGap = props.gap * (props.columns - 1)
  columnWidth.value = (gridWidth - totalGap) / props.columns
  return columnWidth.value
}

// Calculate layout for all photos
function calculateLayout(): void {
  if (!gridRef.value || props.photos.length === 0) {
    containerHeight.value = 0
    return
  }

  // Calculate column width
  calculateColumnWidth()
  
  // Reset column heights
  initColumnHeights()
  itemPositions.value.clear()

  // Calculate position for each photo
  props.photos.forEach(photo => {
    const width = columnWidth.value
    const columnIndex = getShortestColumnIndex()
    const x = columnIndex * (width + props.gap)
    const y = columnHeights.value[columnIndex]

    // Calculate height based on aspect ratio
    let itemHeight: number
    if (photo.width && photo.height) {
      itemHeight = (photo.height / photo.width) * width
    } else {
      // Default 4:3 aspect ratio
      itemHeight = width * 0.75
    }

    // Add footer height estimate if info is shown
    // This is an approximation since tag height varies
    if (props.showInfo) {
      itemHeight += 56 
    }

    // Store position
    itemPositions.value.set(photo.id, {
      x,
      y,
      width,
      height: itemHeight,
      columnIndex
    })

    // Update column height
    columnHeights.value[columnIndex] += itemHeight + props.gap
  })

  // Set container height
  containerHeight.value = Math.max(...columnHeights.value, 0)
}

// Get item style based on calculated position
function getItemStyle(photo: Photo) {
  const position = itemPositions.value.get(photo.id)
  if (!position) {
    // Fallback: calculate on-the-fly if not yet calculated
    return {
      position: 'absolute' as const,
      left: '0px',
      top: '0px',
      width: `${columnWidth.value || 200}px`,
      opacity: 0
    }
  }
  
  return {
    position: 'absolute' as const,
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${position.width}px`,
    opacity: 1,
    transition: 'transform 0.3s ease, opacity 0.3s ease'
  }
}

// Check if photo is selected
function isSelected(photoId: number): boolean {
  return props.selectedIds.includes(photoId)
}

// Handle image load - recalculate if needed
function handleImageLoad(_photo: Photo): void {
  // If the photo has dimensions, no need to recalculate
  // Otherwise, we might need to recalculate
}

// Event handlers
function handlePhotoClick(photo: Photo): void {
  emit('photo-click', photo)
}

function handlePhotoContextMenu(event: MouseEvent, photo: Photo): void {
  emit('photo-contextmenu', event, photo)
}

function handlePhotoSelect(photo: Photo, selected: boolean): void {
  emit('photo-select', photo, selected)
}

function handlePhotoView(photo: Photo): void {
  emit('photo-view', photo)
}

function handlePhotoLike(photo: Photo): void {
  emit('photo-like', photo)
}

// Intersection Observer for infinite scroll
let observer: IntersectionObserver | null = null

function setupIntersectionObserver(): void {
  if (observer) {
    observer.disconnect()
    observer = null
  }

  if (!loadMoreTrigger.value) return
  
  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry.isIntersecting && props.hasMore && !props.loading) {
        emit('load-more')
      }
    },
    {
      root: null,
      rootMargin: '100px',
      threshold: 0
    }
  )
  
  observer.observe(loadMoreTrigger.value)
}

function destroyIntersectionObserver(): void {
  if (observer) {
    observer.disconnect()
    observer = null
  }
}

// Resize handler with debounce
let resizeTimer: ReturnType<typeof setTimeout> | null = null
function handleResize(): void {
  if (resizeTimer) {
    clearTimeout(resizeTimer)
  }
  resizeTimer = setTimeout(() => {
    calculateLayout()
  }, 100)
}

// Setup resize observer
let resizeObserver: ResizeObserver | null = null

function setupResizeObserver(): void {
  if (!gridRef.value || typeof ResizeObserver === 'undefined') return
  
  resizeObserver = new ResizeObserver(() => {
    handleResize()
  })
  
  resizeObserver.observe(gridRef.value)
}

function destroyResizeObserver(): void {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
}

// Lifecycle
onMounted(() => {
  nextTick(() => {
    calculateLayout()
    setupIntersectionObserver()
    setupResizeObserver()
  })
})

onUnmounted(() => {
  destroyIntersectionObserver()
  destroyResizeObserver()
  if (resizeTimer) {
    clearTimeout(resizeTimer)
  }
})

// Watch for column changes
watch(() => props.columns, () => {
  nextTick(() => {
    calculateLayout()
  })
})

// Watch for photos changes
watch(() => props.photos, () => {
  nextTick(() => {
    calculateLayout()
    setupIntersectionObserver()
  })
}, { deep: true })

// Watch for gap changes
watch(() => props.gap, () => {
  nextTick(() => {
    calculateLayout()
  })
})
</script>

<style scoped>
.photo-waterfall-container {
  width: 100%;
  min-height: 200px;
}

/* Loading state */
.waterfall-loading {
  padding: var(--spacing-lg);
}

.loading-grid {
  display: grid;
  gap: var(--spacing-md);
}

.loading-skeleton {
  aspect-ratio: 4 / 3;
  background: linear-gradient(
    90deg,
    var(--color-bg-tertiary) 25%,
    var(--color-bg-secondary) 50%,
    var(--color-bg-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: var(--radius-lg);
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Empty state */
.waterfall-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xxl) var(--spacing-lg);
  text-align: center;
}

.empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  margin-bottom: var(--spacing-lg);
  background-color: var(--color-bg-tertiary);
  border-radius: var(--radius-xl);
}

.empty-icon svg {
  width: 40px;
  height: 40px;
  color: var(--color-text-muted);
}

.empty-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.empty-description {
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
}

/* Waterfall grid - true masonry layout */
.waterfall-grid {
  position: relative;
  width: 100%;
}

.waterfall-item {
  position: absolute;
  transition: transform 0.3s ease, opacity 0.3s ease, left 0.3s ease, top 0.3s ease;
}

/* Load more trigger */
.load-more-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl) var(--spacing-lg);
  min-height: 80px;
}

.load-more-spinner {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: var(--radius-round);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.no-more {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .loading-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  
  .empty-icon {
    width: 64px;
    height: 64px;
  }
  
  .empty-icon svg {
    width: 32px;
    height: 32px;
  }
  
  .empty-title {
    font-size: var(--font-size-lg);
  }
  
  .empty-description {
    font-size: var(--font-size-sm);
  }
}
</style>
