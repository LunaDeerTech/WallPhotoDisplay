<template>
  <Modal
    v-model="isOpen"
    title="筛选图片"
    subtitle="通过标签筛选展示的图片"
    size="md"
    @close="handleClose"
  >
    <div class="settings-content">
      <!-- Tag filter -->
      <div class="setting-group">
        <div class="setting-header">
          <label class="setting-label">标签筛选</label>
          <button
            v-if="localTags.length > 0"
            type="button"
            class="clear-tags-btn"
            @click="localTags = []"
          >
            清空
          </button>
        </div>
        <TagSelector
          v-model:selectedTags="localTags"
          mode="all"
          :limit="20"
          :show-search="true"
          :show-count="true"
          :show-selected-summary="true"
          empty-text="暂无可用标签"
        />
      </div>
    </div>

    <template #footer>
      <div class="dialog-actions">
        <button
          type="button"
          class="btn btn-text"
          @click="resetToDefaults"
        >
          重置
        </button>
        <div class="actions-right">
          <button
            type="button"
            class="btn btn-secondary"
            @click="handleClose"
          >
            取消
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="handleSave"
          >
            应用
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import Modal from '../common/Modal.vue'
import TagSelector from '../common/TagSelector.vue'
import { useSettingsStore } from '@/stores/settings'

interface Props {
  modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const settingsStore = useSettingsStore()

// Local state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const localTags = ref<string[]>([])

// Sync local settings when dialog opens
watch(isOpen, (newValue) => {
  if (newValue) {
    localTags.value = [...settingsStore.selectedTags]
  }
})

// Handle close
function handleClose(): void {
  isOpen.value = false
}

// Handle save
function handleSave(): void {
  settingsStore.setSelectedTags(localTags.value)
  isOpen.value = false
}

// Reset to defaults
function resetToDefaults(): void {
  localTags.value = []
}
</script>

<style scoped>
.settings-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.setting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.setting-label {
  font-weight: 600;
  color: var(--color-text-primary);
}

.clear-tags-btn {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.clear-tags-btn:hover {
  color: var(--color-danger);
}

.dialog-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.actions-right {
  display: flex;
  gap: var(--spacing-md);
}

.btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: none;
}

.btn-text {
  background: none;
  color: var(--color-text-secondary);
  padding-left: 0;
}

.btn-text:hover {
  color: var(--color-text-primary);
}

.btn-secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.btn-secondary:hover {
  background: var(--color-bg-tertiary);
}

.btn-primary {
  background: var(--color-accent);
  color: white;
}

.btn-primary:hover {
  filter: brightness(1.1);
}
</style>
