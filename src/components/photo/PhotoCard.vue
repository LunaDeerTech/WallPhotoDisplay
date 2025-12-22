<template>
  <div
    class="photo-card"
    :class="{
      'photo-card-selectable': selectable,
      'photo-card-selected': selected,
      'photo-card-loading': loading
    }"
    @click="handleClick"
    @contextmenu.prevent="handleContextMenu"
  >
    <!-- Selection checkbox -->
    <Transition name="checkbox">
      <div v-if="selectable" class="photo-checkbox" @click.stop="handleSelect">
        <div class="checkbox-inner" :class="{ 'checkbox-checked': selected }">
          <svg v-if="selected" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    </Transition>

    <!-- Image container with aspect ratio placeholder -->
    <div 
      class="photo-image-container"
      :style="containerStyle"
    >
      <!-- Placeholder / Loading skeleton -->
      <div v-if="loading && !imageError" class="photo-skeleton">
        <div class="skeleton-shimmer" />
      </div>
      
      <!-- Actual image - always rendered for loading to work -->
      <img
        ref="imgRef"
        :src="imageUrl"
        :alt="photo.originalName || 'Photo'"
        class="photo-image"
        :class="{ 'photo-image-loaded': !loading && !imageError }"
        loading="lazy"
        @load="handleImageLoad"
        @error="handleImageError"
      />
      
      <!-- Error state -->
      <div v-if="imageError" class="photo-error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <span>加载失败</span>
      </div>

      <!-- Pending Review Badge -->
      <div v-if="photo.status === 'pending'" class="photo-status-badge pending">
        <span>待审核</span>
      </div>
      <div v-else-if="photo.status === 'rejected'" class="photo-status-badge rejected">
        <span>已拒绝</span>
      </div>
    </div>

    <!-- Photo Footer Info -->
    <div v-if="showInfo" class="photo-footer">
      <!-- Tags -->
      <div v-if="photo.tags && photo.tags.length > 0" class="photo-tags">
        <span 
          v-for="tag in displayTags" 
          :key="tag.id" 
          class="photo-tag"
          @click.stop="handleTagClick(tag.name)"
        >
          #{{ tag.name }}
        </span>
        <span v-if="photo.tags.length > maxDisplayTags" class="photo-tag-more">
          +{{ photo.tags.length - maxDisplayTags }}
        </span>
      </div>
      
      <!-- Meta Info Row -->
      <div class="photo-meta">
        <!-- Uploader -->
        <div class="photo-uploader">
          <span 
            v-if="showUploader && photo.uploaderName" 
            class="uploader-name"
            @click.stop="handleUploaderClick(photo.userId)"
          >
            @{{ photo.uploaderName }}
          </span>
        </div>
        
        <!-- Like Button -->
        <div class="photo-like" @click.stop="handleLike">
          <div class="like-display" :class="{ 'is-liked': photo.isLiked }">
            <svg v-if="photo.isLiked" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span class="like-count">{{ photo.likeCount || 0 }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import type { Photo } from '@/types'

interface Props {
  photo: Photo
  selectable?: boolean
  selected?: boolean
  showInfo?: boolean
  showUploader?: boolean
  maxDisplayTags?: number
}

const props = withDefaults(defineProps<Props>(), {
  selectable: false,
  selected: false,
  showInfo: true,
  showUploader: false,
  maxDisplayTags: 2
})

const emit = defineEmits<{
  'click': [photo: Photo]
  'contextmenu': [event: MouseEvent, photo: Photo]
  'select': [photo: Photo, selected: boolean]
  'view': [photo: Photo]
  'image-load': [photo: Photo]
  'like': [photo: Photo]
  'tag-click': [tag: string]
  'uploader-click': [userId: number]
}>()

// State
const imgRef = ref<HTMLImageElement | null>(null)
const loading = ref(true)
const imageError = ref(false)

// Computed
// 图片 URL - 优先使用缩略图
const imageUrl = computed(() => {
  return props.photo.thumbnailUrl || props.photo.url || ''
})

const displayTags = computed(() => {
  if (!props.photo.tags) return []
  return props.photo.tags.slice(0, props.maxDisplayTags)
})

// Aspect ratio for placeholder
const aspectRatio = computed(() => {
  if (props.photo.width && props.photo.height) {
    return (props.photo.height / props.photo.width) * 100
  }
  return 75 // Default 4:3 aspect ratio
})

// Container style with aspect ratio for proper waterfall layout
const containerStyle = computed(() => {
  if (props.photo.width && props.photo.height) {
    return {
      paddingBottom: `${aspectRatio.value}%`
    }
  }
  // Fallback to default aspect ratio if no dimensions
  return {
    paddingBottom: '75%'
  }
})

// Event handlers
function handleClick(_event: MouseEvent): void {
  if (props.selectable) {
    handleSelect()
  } else {
    emit('click', props.photo)
  }
}

function handleContextMenu(event: MouseEvent): void {
  emit('contextmenu', event, props.photo)
}

function handleSelect(): void {
  emit('select', props.photo, !props.selected)
}

function handleImageLoad(): void {
  loading.value = false
  imageError.value = false
  // Emit event for parent to potentially recalculate layout
  emit('image-load', props.photo)
}

function handleImageError(): void {
  loading.value = false
  imageError.value = true
}

function handleLike(): void {
  emit('like', props.photo)
}

function handleTagClick(tag: string): void {
  emit('tag-click', tag)
}

function handleUploaderClick(userId: number): void {
  emit('uploader-click', userId)
}

// Initialize - check if image is already cached/loaded
onMounted(() => {
  // Check if image is already loaded (from cache)
  nextTick(() => {
    if (imgRef.value) {
      if (imgRef.value.complete && imgRef.value.naturalHeight !== 0) {
        loading.value = false
        imageError.value = false
      }
    }
  })
})
</script>

<style scoped>
.photo-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background-color: var(--color-bg-tertiary);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.photo-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.photo-card:active {
  transform: translateY(0);
}

.photo-card-selectable {
  cursor: pointer;
}

.photo-card-selected {
  box-shadow: 0 0 0 3px var(--color-accent);
}

/* Selection checkbox */
.photo-checkbox {
  position: absolute;
  top: var(--spacing-sm);
  left: var(--spacing-sm);
  z-index: 10;
}

.checkbox-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background-color: rgba(255, 255, 255, 0.9);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  backdrop-filter: blur(8px);
}

.checkbox-inner:hover {
  border-color: var(--color-accent);
}

.checkbox-checked {
  background-color: var(--color-accent);
  border-color: var(--color-accent);
}

.checkbox-inner svg {
  width: 14px;
  height: 14px;
  color: white;
}

/* Checkbox transition */
.checkbox-enter-active,
.checkbox-leave-active {
  transition: all 0.2s ease;
}

.checkbox-enter-from,
.checkbox-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* Image container - supports aspect ratio via padding-bottom */
.photo-image-container {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.photo-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: transform var(--transition-slow), opacity 0.3s ease;
}

.photo-image-loaded {
  opacity: 1;
}

.photo-card:hover .photo-image {
  transform: scale(1.03);
}

/* Loading skeleton - fills the aspect ratio container */
.photo-skeleton {
  position: absolute;
  inset: 0;
  background-color: var(--color-bg-tertiary);
  overflow: hidden;
  z-index: 1;
}

.skeleton-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--color-bg-secondary) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Error state */
.photo-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-muted);
}

.photo-error svg {
  width: 32px;
  height: 32px;
  opacity: 0.5;
}

.photo-error span {
  font-size: var(--font-size-sm);
}

/* Photo Footer */
.photo-footer {
  padding: var(--spacing-sm);
  background-color: var(--color-bg-primary);
  /* border-top: 1px solid var(--color-border-light); */
}

.photo-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
}

.photo-tag {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.photo-tag:hover {
  color: var(--color-accent);
}

.photo-tag-more {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.photo-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.photo-uploader {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.uploader-name {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.uploader-name:hover {
  color: var(--color-accent);
}

.photo-like {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.like-display {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-muted);
  transition: color var(--transition-fast);
  user-select: none;
}

.like-display:hover {
  color: var(--color-text-primary);
}

.like-display.is-liked {
  color: #ef4444;
}

.like-display svg {
  width: 16px;
  height: 16px;
}

.like-count {
  font-size: var(--font-size-xs);
  font-weight: 500;
}

/* Loading state */
.photo-card-loading {
  pointer-events: none;
}

.photo-status-badge {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: white;
  z-index: 2;
  backdrop-filter: blur(4px);
}

.photo-status-badge.pending {
  background-color: rgba(255, 193, 7, 0.8); /* Warning/Yellow */
}

.photo-status-badge.rejected {
  background-color: rgba(244, 67, 54, 0.8); /* Error/Red */
}
</style>
