<template>
  <div class="photo-waterfall-container" ref="containerRef">
    <!-- Loading state -->
    <div v-if="loading && photos.length === 0" class="waterfall-loading">
      <div class="loading-grid">
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
      :style="gridStyle"
      ref="gridRef"
    >
      <div
        v-for="photo in photos"
        :key="photo.id"
        class="waterfall-item"
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

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import PhotoCard from './PhotoCard.vue'

const props = defineProps({
  photos: {
    type: Array,
    default: () => []
  },
  columns: {
    type: Number,
    default: 4
  },
  gap: {
    type: Number,
    default: 16
  },
  loading: {
    type: Boolean,
    default: false
  },
  hasMore: {
    type: Boolean,
    default: true
  },
  selectable: {
    type: Boolean,
    default: false
  },
  selectedIds: {
    type: Array,
    default: () => []
  },
  showInfo: {
    type: Boolean,
    default: true
  },
  showUploader: {
    type: Boolean,
    default: false
  },
  emptyText: {
    type: String,
    default: '试试上传一些照片吧'
  }
})

const emit = defineEmits([
  'load-more',
  'photo-click',
  'photo-contextmenu',
  'photo-select',
  'photo-view'
])

// Refs
const containerRef = ref(null)
const gridRef = ref(null)
const loadMoreTrigger = ref(null)

// State
const columnHeights = ref([])
const itemPositions = ref(new Map())

// Computed
const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${props.columns}, 1fr)`,
  gap: `${props.gap}px`,
  position: 'relative'
}))

// Check if photo is selected
function isSelected(photoId) {
  return props.selectedIds.includes(photoId)
}

// Calculate item position for waterfall
function getItemStyle(photo) {
  return {
    // Using CSS Grid, position is automatic
  }
}

// Event handlers
function handlePhotoClick(photo) {
  emit('photo-click', photo)
}

function handlePhotoContextMenu(event, photo) {
  emit('photo-contextmenu', event, photo)
}

function handlePhotoSelect(photo, selected) {
  emit('photo-select', photo, selected)
}

function handlePhotoView(photo) {
  emit('photo-view', photo)
}

// Intersection Observer for infinite scroll
let observer = null

function setupIntersectionObserver() {
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

function destroyIntersectionObserver() {
  if (observer) {
    observer.disconnect()
    observer = null
  }
}

// Lifecycle
onMounted(() => {
  nextTick(() => {
    setupIntersectionObserver()
  })
})

onUnmounted(() => {
  destroyIntersectionObserver()
})

// Watch for column changes
watch(() => props.columns, () => {
  columnHeights.value = new Array(props.columns).fill(0)
  itemPositions.value.clear()
})

// Watch for photos changes
watch(() => props.photos, () => {
  nextTick(() => {
    // Recalculate positions if needed
  })
}, { deep: true })
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
  grid-template-columns: repeat(v-bind(columns), 1fr);
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

/* Waterfall grid */
.waterfall-grid {
  width: 100%;
}

.waterfall-item {
  break-inside: avoid;
  page-break-inside: avoid;
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
    grid-template-columns: repeat(2, 1fr);
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
