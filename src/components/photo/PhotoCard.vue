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

    <!-- Image container -->
    <div class="photo-image-container">
      <!-- Placeholder / Loading skeleton -->
      <div v-if="loading" class="photo-skeleton">
        <div class="skeleton-shimmer" />
      </div>
      
      <!-- Actual image -->
      <img
        v-else
        ref="imgRef"
        :src="thumbnailUrl || photo.url"
        :alt="photo.originalName || 'Photo'"
        class="photo-image"
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
    </div>

    <!-- Photo info overlay -->
    <div v-if="showInfo" class="photo-info">
      <div class="photo-info-content">
        <!-- Tags -->
        <div v-if="photo.tags && photo.tags.length > 0" class="photo-tags">
          <span v-for="tag in displayTags" :key="tag" class="photo-tag">
            #{{ tag }}
          </span>
          <span v-if="photo.tags.length > maxDisplayTags" class="photo-tag-more">
            +{{ photo.tags.length - maxDisplayTags }}
          </span>
        </div>
        
        <!-- Uploader info -->
        <div v-if="showUploader && photo.uploaderName" class="photo-uploader">
          <span class="uploader-name">{{ photo.uploaderName }}</span>
        </div>
      </div>
    </div>

    <!-- Hover overlay -->
    <div class="photo-hover-overlay">
      <div class="hover-actions">
        <button
          type="button"
          class="hover-action-btn"
          @click.stop="$emit('view', photo)"
          title="查看大图"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
            <path d="M11 8v6M8 11h6"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  photo: {
    type: Object,
    required: true
    // Expected structure:
    // {
    //   id: number,
    //   url: string,
    //   thumbnailUrl?: string,
    //   originalName?: string,
    //   width: number,
    //   height: number,
    //   tags?: string[],
    //   uploaderName?: string,
    //   userId?: number
    // }
  },
  selectable: {
    type: Boolean,
    default: false
  },
  selected: {
    type: Boolean,
    default: false
  },
  showInfo: {
    type: Boolean,
    default: true
  },
  showUploader: {
    type: Boolean,
    default: false
  },
  maxDisplayTags: {
    type: Number,
    default: 2
  }
})

const emit = defineEmits(['click', 'contextmenu', 'select', 'view'])

// State
const imgRef = ref(null)
const loading = ref(true)
const imageError = ref(false)

// Computed
const thumbnailUrl = computed(() => {
  return props.photo.thumbnailUrl || props.photo.url
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

// Event handlers
function handleClick(event) {
  if (props.selectable) {
    handleSelect()
  } else {
    emit('click', props.photo)
  }
}

function handleContextMenu(event) {
  emit('contextmenu', event, props.photo)
}

function handleSelect() {
  emit('select', props.photo, !props.selected)
}

function handleImageLoad() {
  loading.value = false
  imageError.value = false
}

function handleImageError() {
  loading.value = false
  imageError.value = true
}

// Initialize with loading state
onMounted(() => {
  // Small delay for better UX
  setTimeout(() => {
    if (imgRef.value?.complete) {
      loading.value = false
    }
  }, 50)
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

/* Image container */
.photo-image-container {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.photo-image {
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
  transition: transform var(--transition-slow);
}

.photo-card:hover .photo-image {
  transform: scale(1.03);
}

/* Loading skeleton */
.photo-skeleton {
  position: relative;
  width: 100%;
  padding-bottom: 75%;
  background-color: var(--color-bg-tertiary);
  overflow: hidden;
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

/* Photo info overlay */
.photo-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--spacing-md);
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, transparent 100%);
  pointer-events: none;
}

.photo-info-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.photo-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.photo-tag {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.photo-tag-more {
  font-size: var(--font-size-xs);
  color: rgba(255, 255, 255, 0.7);
}

.photo-uploader {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.uploader-name {
  font-size: var(--font-size-xs);
  color: rgba(255, 255, 255, 0.8);
}

/* Hover overlay */
.photo-hover-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0);
  opacity: 0;
  transition: all var(--transition-normal);
  pointer-events: none;
}

.photo-card:hover .photo-hover-overlay {
  background-color: rgba(0, 0, 0, 0.3);
  opacity: 1;
  pointer-events: auto;
}

.hover-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.hover-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: var(--radius-round);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-fast);
  transform: scale(0.9);
}

.photo-card:hover .hover-action-btn {
  transform: scale(1);
}

.hover-action-btn:hover {
  background-color: white;
  transform: scale(1.1);
}

.hover-action-btn:active {
  transform: scale(0.95);
}

.hover-action-btn svg {
  width: 20px;
  height: 20px;
}

/* Loading state */
.photo-card-loading {
  pointer-events: none;
}
</style>
