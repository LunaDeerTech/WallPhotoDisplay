<template>
  <Teleport to="body">
    <Transition name="viewer">
      <div
        v-if="modelValue"
        class="photo-viewer"
        @wheel.prevent="handleWheel"
      >
        <!-- Backdrop -->
        <div class="viewer-backdrop" @click="close" />

        <!-- Navigation buttons -->
        <button
          v-if="hasPrev"
          class="viewer-nav viewer-nav-prev"
          @click="prev"
          :disabled="isAnimating"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <button
          v-if="hasNext"
          class="viewer-nav viewer-nav-next"
          @click="next"
          :disabled="isAnimating"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        <!-- Main image container -->
        <div
          class="viewer-content"
          ref="contentRef"
          @mousedown="handleDragStart"
          @touchstart.passive="handleTouchStart"
        >
          <Transition :name="slideDirection" mode="out-in">
            <div
              :key="currentPhoto?.id"
              class="viewer-image-wrapper"
              :style="imageWrapperStyle"
            >
              <!-- Loading spinner -->
              <div v-if="isLoading" class="viewer-loading">
                <div class="loading-spinner" />
              </div>

              <!-- Image -->
              <img
                ref="imageRef"
                :src="currentPhoto?.url"
                :alt="currentPhoto?.originalName || 'Photo'"
                class="viewer-image"
                :style="imageStyle"
                @load="handleImageLoad"
                @error="handleImageError"
                draggable="false"
              />
            </div>
          </Transition>
        </div>

        <!-- Toolbar -->
        <div class="viewer-toolbar">
          <div class="toolbar-left">
            <!-- Photo info -->
            <div v-if="currentPhoto" class="photo-info">
              <span v-if="photos.length > 1" class="photo-index">
                {{ currentIndex + 1 }} / {{ photos.length }}
              </span>
            </div>
          </div>

          <div class="toolbar-center">
            <!-- Zoom controls -->
            <button
              class="toolbar-btn"
              @click="zoomOut"
              :disabled="scale <= minScale"
              title="缩小"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
                <path d="M8 11h6"/>
              </svg>
            </button>

            <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>

            <button
              class="toolbar-btn"
              @click="zoomIn"
              :disabled="scale >= maxScale"
              title="放大"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
                <path d="M11 8v6M8 11h6"/>
              </svg>
            </button>

            <button
              class="toolbar-btn"
              @click="resetZoom"
              title="重置"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </button>
          </div>

          <div class="toolbar-right">
            <!-- Download button -->
            <button
              class="toolbar-btn"
              @click="download"
              title="下载"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>

            <!-- Close button -->
            <button
              class="toolbar-btn toolbar-btn-close"
              @click="close"
              title="关闭"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Thumbnail strip (optional) -->
        <div v-if="photos.length > 1 && showThumbnails" class="viewer-thumbnails">
          <button
            v-for="(photo, index) in photos"
            :key="photo.id"
            class="thumbnail-item"
            :class="{ 'thumbnail-active': index === currentIndex }"
            @click="goTo(index)"
          >
            <img
              :src="photo.thumbnailUrl || photo.url"
              :alt="photo.originalName"
              loading="lazy"
            />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  photos: {
    type: Array,
    default: () => []
  },
  initialIndex: {
    type: Number,
    default: 0
  },
  showThumbnails: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'close', 'change'])

// Refs
const contentRef = ref(null)
const imageRef = ref(null)

// State
const currentIndex = ref(props.initialIndex)
const isLoading = ref(true)
const isAnimating = ref(false)
const slideDirection = ref('slide-left')

// Zoom state
const scale = ref(1)
const minScale = 0.5
const maxScale = 4
const zoomStep = 0.25

// Pan state
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const translateStart = ref({ x: 0, y: 0 })

// Computed
const currentPhoto = computed(() => props.photos[currentIndex.value])
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < props.photos.length - 1)

const imageWrapperStyle = computed(() => ({
  transform: `translate(${translateX.value}px, ${translateY.value}px)`
}))

const imageStyle = computed(() => ({
  transform: `scale(${scale.value})`,
  cursor: scale.value > 1 ? (isDragging.value ? 'grabbing' : 'grab') : 'default'
}))

// Methods
function close() {
  emit('update:modelValue', false)
  emit('close')
}

function prev() {
  if (!hasPrev.value || isAnimating.value) return
  slideDirection.value = 'slide-right'
  isAnimating.value = true
  currentIndex.value--
  resetTransform()
  setTimeout(() => { isAnimating.value = false }, 300)
}

function next() {
  if (!hasNext.value || isAnimating.value) return
  slideDirection.value = 'slide-left'
  isAnimating.value = true
  currentIndex.value++
  resetTransform()
  setTimeout(() => { isAnimating.value = false }, 300)
}

function goTo(index) {
  if (index === currentIndex.value || isAnimating.value) return
  slideDirection.value = index > currentIndex.value ? 'slide-left' : 'slide-right'
  isAnimating.value = true
  currentIndex.value = index
  resetTransform()
  setTimeout(() => { isAnimating.value = false }, 300)
}

function zoomIn() {
  scale.value = Math.min(scale.value + zoomStep, maxScale)
}

function zoomOut() {
  scale.value = Math.max(scale.value - zoomStep, minScale)
  if (scale.value <= 1) {
    resetTransform()
  }
}

function resetZoom() {
  resetTransform()
}

function resetTransform() {
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
}

function download() {
  if (!currentPhoto.value) return
  
  const link = document.createElement('a')
  link.href = currentPhoto.value.url
  link.download = currentPhoto.value.originalName || 'photo'
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Event handlers
function handleImageLoad() {
  isLoading.value = false
}

function handleImageError() {
  isLoading.value = false
}

function handleWheel(event) {
  const delta = event.deltaY > 0 ? -zoomStep : zoomStep
  scale.value = Math.min(Math.max(scale.value + delta, minScale), maxScale)
  
  if (scale.value <= 1) {
    resetTransform()
  }
}

function handleDragStart(event) {
  if (scale.value <= 1) return
  
  isDragging.value = true
  dragStart.value = { x: event.clientX, y: event.clientY }
  translateStart.value = { x: translateX.value, y: translateY.value }
  
  document.addEventListener('mousemove', handleDragMove)
  document.addEventListener('mouseup', handleDragEnd)
}

function handleDragMove(event) {
  if (!isDragging.value) return
  
  const dx = event.clientX - dragStart.value.x
  const dy = event.clientY - dragStart.value.y
  
  translateX.value = translateStart.value.x + dx
  translateY.value = translateStart.value.y + dy
}

function handleDragEnd() {
  isDragging.value = false
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', handleDragEnd)
}

// Touch handlers
function handleTouchStart(event) {
  if (event.touches.length !== 1 || scale.value <= 1) return
  
  isDragging.value = true
  const touch = event.touches[0]
  dragStart.value = { x: touch.clientX, y: touch.clientY }
  translateStart.value = { x: translateX.value, y: translateY.value }
  
  document.addEventListener('touchmove', handleTouchMove, { passive: false })
  document.addEventListener('touchend', handleTouchEnd)
}

function handleTouchMove(event) {
  if (!isDragging.value || event.touches.length !== 1) return
  
  event.preventDefault()
  const touch = event.touches[0]
  const dx = touch.clientX - dragStart.value.x
  const dy = touch.clientY - dragStart.value.y
  
  translateX.value = translateStart.value.x + dx
  translateY.value = translateStart.value.y + dy
}

function handleTouchEnd() {
  isDragging.value = false
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
}

// Keyboard navigation
function handleKeydown(event) {
  if (!props.modelValue) return
  
  switch (event.key) {
    case 'Escape':
      close()
      break
    case 'ArrowLeft':
      prev()
      break
    case 'ArrowRight':
      next()
      break
    case '+':
    case '=':
      zoomIn()
      break
    case '-':
      zoomOut()
      break
    case '0':
      resetZoom()
      break
  }
}

// Lifecycle
watch(() => props.modelValue, (value) => {
  if (value) {
    currentIndex.value = props.initialIndex
    isLoading.value = true
    resetTransform()
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', handleKeydown)
  }
})

watch(currentIndex, (value) => {
  isLoading.value = true
  emit('change', value, currentPhoto.value)
})

onUnmounted(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', handleDragEnd)
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
})
</script>

<style scoped>
.photo-viewer {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  flex-direction: column;
  background-color: rgba(0, 0, 0, 0.95);
}

.viewer-backdrop {
  position: absolute;
  inset: 0;
}

/* Navigation buttons */
.viewer-nav {
  position: absolute;
  top: 50%;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-round);
  color: white;
  transform: translateY(-50%);
  transition: all var(--transition-fast);
  backdrop-filter: blur(8px);
}

.viewer-nav:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.2);
}

.viewer-nav:active:not(:disabled) {
  transform: translateY(-50%) scale(0.95);
}

.viewer-nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.viewer-nav svg {
  width: 24px;
  height: 24px;
}

.viewer-nav-prev {
  left: var(--spacing-lg);
}

.viewer-nav-next {
  right: var(--spacing-lg);
}

/* Content area */
.viewer-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  user-select: none;
}

.viewer-image-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s ease;
}

.viewer-image {
  max-width: 90vw;
  max-height: 80vh;
  object-fit: contain;
  transition: transform 0.2s ease;
}

/* Loading spinner */
.viewer-loading {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: white;
  border-radius: var(--radius-round);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Toolbar */
.viewer-toolbar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, transparent 100%);
}

.toolbar-left,
.toolbar-center,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.toolbar-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.photo-info {
  color: white;
  font-size: var(--font-size-sm);
}

.photo-index {
  opacity: 0.8;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-round);
  color: white;
  transition: all var(--transition-fast);
  backdrop-filter: blur(8px);
}

.toolbar-btn:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.2);
}

.toolbar-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.toolbar-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.toolbar-btn svg {
  width: 20px;
  height: 20px;
}

.toolbar-btn-close {
  background-color: rgba(255, 59, 48, 0.3);
}

.toolbar-btn-close:hover {
  background-color: rgba(255, 59, 48, 0.5);
}

.zoom-level {
  min-width: 50px;
  text-align: center;
  font-size: var(--font-size-sm);
  color: white;
  opacity: 0.8;
}

/* Thumbnails */
.viewer-thumbnails {
  display: flex;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: rgba(0, 0, 0, 0.5);
  overflow-x: auto;
  scrollbar-width: none;
}

.viewer-thumbnails::-webkit-scrollbar {
  display: none;
}

.thumbnail-item {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  padding: 2px;
  background-color: transparent;
  border: 2px solid transparent;
  border-radius: var(--radius-sm);
  overflow: hidden;
  transition: all var(--transition-fast);
}

.thumbnail-item:hover {
  border-color: rgba(255, 255, 255, 0.5);
}

.thumbnail-active {
  border-color: white;
}

.thumbnail-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: calc(var(--radius-sm) - 2px);
}

/* Viewer transitions */
.viewer-enter-active {
  transition: opacity 0.3s ease;
}

.viewer-leave-active {
  transition: opacity 0.2s ease;
}

.viewer-enter-from,
.viewer-leave-to {
  opacity: 0;
}

/* Slide transitions */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(50px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-50px);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-50px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(50px);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .viewer-nav {
    width: 44px;
    height: 44px;
  }
  
  .viewer-nav svg {
    width: 20px;
    height: 20px;
  }
  
  .viewer-nav-prev {
    left: var(--spacing-sm);
  }
  
  .viewer-nav-next {
    right: var(--spacing-sm);
  }
  
  .viewer-image {
    max-width: 100vw;
    max-height: 70vh;
  }
  
  .viewer-toolbar {
    padding: var(--spacing-sm) var(--spacing-md);
  }
  
  .toolbar-btn {
    width: 36px;
    height: 36px;
  }
  
  .toolbar-btn svg {
    width: 18px;
    height: 18px;
  }
  
  .thumbnail-item {
    width: 50px;
    height: 50px;
  }
}
</style>
