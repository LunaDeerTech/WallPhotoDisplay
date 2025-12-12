<template>
  <Modal
    v-model="isOpen"
    title="上传图片"
    subtitle="支持 JPG、PNG、GIF、WebP 格式"
    size="md"
    @close="handleClose"
  >
    <div class="upload-content">
      <!-- Drop zone -->
      <div
        class="drop-zone"
        :class="{ dragging: isDragging, 'has-files': files.length > 0 }"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        @click="triggerFileSelect"
      >
        <input
          ref="fileInputRef"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          class="file-input"
          @change="handleFileSelect"
        />
        
        <template v-if="files.length === 0">
          <svg class="drop-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p class="drop-text">
            <span class="drop-primary">点击或拖拽图片到此处</span>
            <span class="drop-hint">最多上传 20 张，单张不超过 10MB</span>
          </p>
        </template>
        
        <template v-else>
          <svg class="drop-icon small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <p class="drop-text">继续添加图片</p>
        </template>
      </div>

      <!-- File list -->
      <div v-if="files.length > 0" class="file-list">
        <div class="file-list-header">
          <span>已选择 {{ files.length }} 张图片</span>
          <button type="button" class="clear-btn" @click="clearFiles">清空</button>
        </div>
        
        <div class="file-grid">
          <div
            v-for="(file, index) in files"
            :key="file.name + index"
            class="file-item"
            :class="{ error: file.error }"
          >
            <img :src="file.preview" :alt="file.name" />
            <button
              type="button"
              class="file-remove"
              @click="removeFile(index)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div v-if="file.error" class="file-error">
              {{ file.error }}
            </div>
            <div v-if="uploading && !file.uploaded && !file.error" class="file-uploading">
              <div class="upload-progress" :style="{ width: uploadProgress + '%' }" />
            </div>
            <div v-if="file.uploaded" class="file-uploaded">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Tags input -->
      <div class="section">
        <label class="section-label">添加标签（可选）</label>
        <TagInput
          v-model="tags"
          placeholder="输入 #标签名 添加标签"
          hint="标签将应用到所有上传的图片"
          :allow-create="true"
        />
        
        <div v-if="recommendedTags.length > 0" class="recommended-tags">
          <span class="recommended-label">推荐标签：</span>
          <div class="tags-wrapper">
            <button
              v-for="tag in recommendedTags"
              :key="tag.id"
              type="button"
              class="tag-chip"
              @click="addRecommendedTag(tag.name)"
            >
              #{{ tag.name }}
            </button>
          </div>
        </div>
      </div>

      <!-- Upload error -->
      <Transition name="fade">
        <div v-if="uploadError" class="upload-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{{ uploadError }}</span>
        </div>
      </Transition>
    </div>

    <!-- @vue-ignore -->
    <template #footer>
      <div class="dialog-actions">
        <button
          type="button"
          class="btn btn-secondary"
          @click="handleClose"
          :disabled="uploading"
        >
          取消
        </button>
        <button
          type="button"
          class="btn btn-primary"
          @click="handleUpload"
          :disabled="uploading || validFiles.length === 0"
        >
          <template v-if="uploading">
            <svg class="spinner" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3"/>
            </svg>
            <span>上传中 {{ uploadProgress }}%</span>
          </template>
          <template v-else>
            <span>上传 {{ validFiles.length }} 张图片</span>
          </template>
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Modal from '../common/Modal.vue'
import TagInput from '../common/TagInput.vue'
import photosApi from '@/api/photos'
import tagsApi, { type TagWithCount } from '@/api/tags'
import type { Photo } from '@/types'
import { useToast } from '@/composables/useToast'

interface Props {
  modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': [photos: Photo[]]
}>()

const toast = useToast()

// Constants
const MAX_FILES = 20
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

interface FileData {
  file: File
  name: string
  size: number
  type: string
  preview: string
  error: string | null
  uploaded: boolean
}

// Local state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const files = ref<FileData[]>([])
const tags = ref<string[]>([])
const isDragging = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadError = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)
const recommendedTags = ref<TagWithCount[]>([])

// Computed
const validFiles = computed(() => files.value.filter(f => !f.error))

// Cleanup Object URLs helper
function cleanupPreviews(): void {
  files.value.forEach(file => {
    if (file.preview && file.preview.startsWith('blob:')) {
      URL.revokeObjectURL(file.preview)
    }
  })
}

// Reset when dialog opens/closes
watch(isOpen, (newValue, oldValue) => {
  if (newValue) {
    files.value = []
    tags.value = []
    uploadError.value = ''
    uploadProgress.value = 0
    isDragging.value = false
    fetchRecommendedTags()
  } else if (oldValue) {
    // Cleanup Object URLs when closing
    cleanupPreviews()
  }
})

// Fetch recommended tags
async function fetchRecommendedTags() {
  try {
    const res = await tagsApi.getRandomTags(10)
    if (res.success && res.data) {
      recommendedTags.value = res.data
    }
  } catch (e) {
    console.error('Failed to fetch recommended tags', e)
  }
}

// Add recommended tag
function addRecommendedTag(tagName: string) {
  if (!tags.value.includes(tagName)) {
    tags.value.push(tagName)
  }
}

// Trigger file select
function triggerFileSelect(): void {
  fileInputRef.value?.click()
}

// Handle file select from input
function handleFileSelect(event: Event): void {
  const target = event.target as HTMLInputElement
  const selectedFiles = Array.from(target.files || [])
  addFiles(selectedFiles)
  target.value = '' // Reset input
}

// Handle drop
function handleDrop(event: DragEvent): void {
  isDragging.value = false
  const droppedFiles = Array.from(event.dataTransfer?.files || [])
  addFiles(droppedFiles)
}

// Add files with validation
function addFiles(newFiles: File[]): void {
  const remainingSlots = MAX_FILES - files.value.length
  
  if (remainingSlots <= 0) {
    uploadError.value = `最多只能上传 ${MAX_FILES} 张图片`
    return
  }
  
  uploadError.value = ''
  
  newFiles.slice(0, remainingSlots).forEach(file => {
    const fileData: FileData = {
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: '',
      error: null,
      uploaded: false
    }
    
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      fileData.error = '不支持的格式'
    }
    // Validate file size
    else if (file.size > MAX_FILE_SIZE) {
      fileData.error = '超过 10MB'
    }
    else {
      // Create preview using URL.createObjectURL for immediate display
      fileData.preview = URL.createObjectURL(file)
    }
    
    files.value.push(fileData)
  })
}

// Remove file
function removeFile(index: number): void {
  const file = files.value[index]
  if (file.preview && file.preview.startsWith('blob:')) {
    URL.revokeObjectURL(file.preview)
  }
  files.value.splice(index, 1)
}

// Clear all files
function clearFiles(): void {
  files.value.forEach(file => {
    if (file.preview && file.preview.startsWith('blob:')) {
      URL.revokeObjectURL(file.preview)
    }
  })
  files.value = []
}

// Handle close
function handleClose(): void {
  if (!uploading.value) {
    isOpen.value = false
  }
}

// Handle upload
async function handleUpload(): Promise<void> {
  if (uploading.value || validFiles.value.length === 0) return
  
  uploading.value = true
  uploadError.value = ''
  uploadProgress.value = 0
  
  try {
    const filesToUpload = validFiles.value.map(f => f.file)
    
    const response = await photosApi.uploadPhotos(
      filesToUpload,
      tags.value.map(t => `#${t}`).join(' '),
      (progress) => {
        uploadProgress.value = progress
      }
    )
    
    if (response.success && response.data) {
      // Mark all as uploaded
      files.value.forEach(f => {
        if (!f.error) f.uploaded = true
      })
      
      // Save photos before setTimeout to preserve type narrowing
      const uploadedPhotos = response.data.photos
      
      const hasPending = uploadedPhotos.some(p => p.status === 'pending')
      if (hasPending) {
        toast.info('上传成功，部分图片需要审核后显示')
      } else {
        toast.success('上传成功')
      }
      
      // Emit success and close
      setTimeout(() => {
        emit('success', uploadedPhotos)
        isOpen.value = false
      }, 500)
    } else {
      uploadError.value = response.error || '上传失败'
    }
  } catch (error) {
    uploadError.value = '网络错误，请稍后重试'
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.upload-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* Drop zone */
.drop-zone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xxl);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-bg-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.drop-zone:hover {
  border-color: var(--color-accent);
  background-color: var(--color-accent-lighter);
}

.drop-zone.dragging {
  border-color: var(--color-accent);
  background-color: var(--color-accent-light);
  transform: scale(1.01);
}

.drop-zone.has-files {
  padding: var(--spacing-lg);
}

.file-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.drop-icon {
  width: 64px;
  height: 64px;
  color: var(--color-text-muted);
  transition: color var(--transition-fast);
}

.drop-icon.small {
  width: 32px;
  height: 32px;
}

.drop-zone:hover .drop-icon,
.drop-zone.dragging .drop-icon {
  color: var(--color-accent);
}

.drop-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  text-align: center;
}

.drop-primary {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.drop-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

/* File list */
.file-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.clear-btn {
  font-size: var(--font-size-sm);
  color: var(--color-accent);
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.clear-btn:hover {
  background-color: var(--color-accent-light);
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: var(--spacing-md);
}

.file-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--color-bg-tertiary);
}

.file-item.error {
  opacity: 0.6;
}

.file-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-remove {
  position: absolute;
  top: var(--spacing-xs);
  right: var(--spacing-xs);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.6);
  border: none;
  border-radius: var(--radius-round);
  color: white;
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.file-item:hover .file-remove {
  opacity: 1;
}

.file-remove svg {
  width: 14px;
  height: 14px;
}

.file-error {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--spacing-xs);
  background-color: rgba(255, 59, 48, 0.9);
  color: white;
  font-size: var(--font-size-xs);
  text-align: center;
}

.file-uploading {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background-color: rgba(0, 0, 0, 0.3);
}

.upload-progress {
  height: 100%;
  background-color: var(--color-accent);
  transition: width var(--transition-fast);
}

.file-uploaded {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(52, 199, 89, 0.8);
  color: white;
}

.file-uploaded svg {
  width: 32px;
  height: 32px;
}

/* Section */
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

/* Upload error */
.upload-error {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: rgba(255, 59, 48, 0.1);
  border-radius: var(--radius-md);
  color: var(--color-error);
  font-size: var(--font-size-sm);
}

.upload-error svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
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
  gap: var(--spacing-sm);
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

.spinner {
  width: 18px;
  height: 18px;
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

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-fast);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Recommended tags */
.recommended-tags {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
}

.recommended-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.tags-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.tag-chip {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  background-color: var(--color-bg-tertiary);
  border: 1px solid transparent;
  border-radius: var(--radius-round);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tag-chip:hover {
  color: var(--color-accent);
  background-color: var(--color-accent-light);
  border-color: var(--color-accent);
}
</style>
