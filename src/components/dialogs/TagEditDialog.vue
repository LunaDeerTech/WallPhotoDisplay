<template>
  <Modal
    v-model="isOpen"
    title="编辑标签"
    :subtitle="photos.length > 1 ? `批量编辑 ${photos.length} 张图片` : undefined"
    size="md"
    @close="handleClose"
  >
    <div class="tag-edit-content">
      <!-- Current tags -->
      <div class="section">
        <label class="section-label">当前标签</label>
        <TagInput
          v-model="currentTags"
          placeholder="输入 #标签名 添加标签"
          hint="输入 # 开头的标签，空格或回车确认"
          :allow-create="true"
        />
      </div>

      <!-- Tag suggestions -->
      <div class="section">
        <label class="section-label">推荐标签</label>
        <TagSelector
          v-model:selectedTags="currentTags"
          mode="random"
          :limit="12"
          :show-count="true"
          empty-text="暂无推荐标签"
        />
      </div>

      <!-- Preview (single photo) -->
      <div v-if="photos.length === 1 && photos[0]" class="section">
        <label class="section-label">图片预览</label>
        <div class="photo-preview">
          <img :src="photos[0].thumbnailUrl || photos[0].url" :alt="photos[0].originalName" />
          <div class="photo-info">
            <span class="photo-name">{{ photos[0].originalName }}</span>
            <span class="photo-tags" v-if="photos[0].tags?.length">
              {{ photos[0].tags.map(t => '#' + t).join(' ') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Multi-photo preview -->
      <div v-else-if="photos.length > 1" class="section">
        <label class="section-label">选中的图片</label>
        <div class="photos-preview">
          <div
            v-for="photo in photos.slice(0, 6)"
            :key="photo.id"
            class="preview-item"
          >
            <img :src="photo.thumbnailUrl || photo.url" :alt="photo.originalName" />
          </div>
          <div v-if="photos.length > 6" class="preview-more">
            +{{ photos.length - 6 }}
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-actions">
        <button
          type="button"
          class="btn btn-secondary"
          @click="handleClose"
          :disabled="saving"
        >
          取消
        </button>
        <button
          type="button"
          class="btn btn-primary"
          @click="handleSave"
          :disabled="saving"
        >
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Modal from '../common/Modal.vue'
import TagInput from '../common/TagInput.vue'
import TagSelector from '../common/TagSelector.vue'
import photosApi from '../../api/photos.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  photos: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

// Local state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const currentTags = ref([])
const saving = ref(false)

// Initialize tags when dialog opens
watch(isOpen, (newValue) => {
  if (newValue && props.photos.length > 0) {
    if (props.photos.length === 1) {
      // Single photo: use its current tags
      currentTags.value = [...(props.photos[0].tags || [])]
    } else {
      // Multiple photos: find common tags
      const tagSets = props.photos.map(p => new Set(p.tags || []))
      const firstSet = tagSets[0]
      const commonTags = [...firstSet].filter(tag =>
        tagSets.every(set => set.has(tag))
      )
      currentTags.value = commonTags
    }
  } else {
    currentTags.value = []
  }
})

// Handle close
function handleClose() {
  if (!saving.value) {
    isOpen.value = false
  }
}

// Handle save
async function handleSave() {
  if (saving.value || props.photos.length === 0) return
  
  saving.value = true
  
  try {
    if (props.photos.length === 1) {
      // Single photo update
      await photosApi.updatePhotoTags(props.photos[0].id, currentTags.value)
    } else {
      // Batch update
      const ids = props.photos.map(p => p.id)
      await photosApi.batchUpdateTags(ids, currentTags.value)
    }
    
    emit('success')
    isOpen.value = false
  } catch (error) {
    console.error('Update tags error:', error)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.tag-edit-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.section-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

/* Photo preview (single) */
.photo-preview {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

.photo-preview img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.photo-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  min-width: 0;
}

.photo-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.photo-tags {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

/* Photos preview (multiple) */
.photos-preview {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.preview-item {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-more {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

/* Dialog actions */
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

.btn-primary {
  background-color: var(--color-accent);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-accent-hover);
}

.btn-secondary {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-bg-tertiary);
}
</style>
