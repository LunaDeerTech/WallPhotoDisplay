<template>
  <div class="tag-selector">
    <!-- Search input (optional) -->
    <div v-if="showSearch" class="tag-search">
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="M21 21l-4.35-4.35"/>
      </svg>
      <input
        v-model="searchKeyword"
        type="text"
        class="search-input"
        placeholder="搜索标签..."
        @input="handleSearch"
      />
    </div>

    <!-- Tags list -->
    <div class="tags-container" :class="{ 'tags-wrap': wrap }">
      <div class="tags-list">
        <!-- Loading skeleton -->
        <template v-if="loading">
          <div
            v-for="i in skeletonCount"
            :key="`skeleton-${i}`"
            class="tag-skeleton"
          />
        </template>

        <!-- Tags -->
        <template v-else>
          <button
            v-for="tag in displayedTags"
            :key="tag.id || tag.name"
            type="button"
            class="tag-btn"
            :class="{ 'tag-selected': isSelected(tag.name) }"
            @click="toggleTag(tag)"
          >
            <span class="tag-name">#{{ tag.name }}</span>
            <span v-if="showCount && tag.count !== undefined" class="tag-count">
              {{ tag.count }}
            </span>
            <svg
              v-if="isSelected(tag.name)"
              class="tag-check"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
            >
              <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <!-- Empty state -->
          <p v-if="displayedTags.length === 0" class="tags-empty">
            {{ emptyText }}
          </p>
        </template>
      </div>

      <!-- Load more button -->
      <button
        v-if="hasMore && !loading"
        type="button"
        class="load-more-btn"
        @click="loadMore"
      >
        加载更多
      </button>
    </div>

    <!-- Selected tags summary -->
    <div v-if="showSelectedSummary && selectedTags.length > 0" class="selected-summary">
      <span class="summary-label">已选择:</span>
      <div class="summary-tags">
        <button
          v-for="tag in selectedTags"
          :key="tag"
          type="button"
          class="summary-tag"
          @click.stop="removeSelectedTag(tag)"
        >
          #{{ tag }}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import tagsApi from '@/api/tags'
import type { Tag } from '@/types'

type SelectorMode = 'random' | 'all' | 'search'

interface Props {
  selectedTags?: string[]
  mode?: SelectorMode
  limit?: number
  showSearch?: boolean
  showCount?: boolean
  showSelectedSummary?: boolean
  wrap?: boolean
  multiSelect?: boolean
  emptyText?: string
}

const props = withDefaults(defineProps<Props>(), {
  selectedTags: () => [],
  mode: 'random',
  limit: 10,
  showSearch: false,
  showCount: true,
  showSelectedSummary: false,
  wrap: true,
  multiSelect: true,
  emptyText: '暂无标签'
})

const emit = defineEmits<{
  'select': [tagName: string]
  'toggle': [tagName: string]
  'update:selectedTags': [tags: string[]]
}>()

// State
const tags = ref<Tag[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const page = ref(1)
const hasMore = ref(false)
const searchDebounceTimer = ref<ReturnType<typeof setTimeout> | null>(null)

// Computed
const skeletonCount = computed(() => Math.min(props.limit, 6))

const displayedTags = computed(() => {
  if (searchKeyword.value && props.showSearch) {
    return tags.value
  }
  return tags.value.slice(0, page.value * props.limit)
})

// Methods
function isSelected(tagName: string): boolean {
  return props.selectedTags.includes(tagName)
}

function toggleTag(tag: Tag): void {
  if (props.multiSelect) {
    const newSelected = isSelected(tag.name)
      ? props.selectedTags.filter(t => t !== tag.name)
      : [...props.selectedTags, tag.name]
    
    emit('update:selectedTags', newSelected)
    emit('toggle', tag.name)
  } else {
    emit('select', tag.name)
    emit('update:selectedTags', [tag.name])
  }
}

function removeSelectedTag(tagName: string): void {
  if (props.multiSelect) {
    const newSelected = props.selectedTags.filter(t => t !== tagName)
    emit('update:selectedTags', newSelected)
    emit('toggle', tagName)
  } else {
    // For single select mode, removing the last tag clears the selection
    emit('update:selectedTags', [])
    emit('toggle', tagName)
  }
}

async function fetchTags(): Promise<void> {
  loading.value = true
  
  try {
    let response
    
    if (props.mode === 'random') {
      response = await tagsApi.getRandomTags(props.limit)
    } else {
      response = await tagsApi.getAllTags()
    }
    
    if (response.success && response.data) {
      tags.value = response.data
      hasMore.value = props.mode === 'all' && response.data.length > props.limit
    }
  } catch (error) {
    console.error('Fetch tags error:', error)
  } finally {
    loading.value = false
  }
}

async function searchTags(keyword: string): Promise<void> {
  if (!keyword) {
    fetchTags()
    return
  }
  
  loading.value = true
  
  try {
    const response = await tagsApi.searchTags(keyword, 20)
    if (response.success && response.data) {
      tags.value = response.data
      hasMore.value = false
    }
  } catch (error) {
    console.error('Search tags error:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value)
  }
  
  searchDebounceTimer.value = setTimeout(() => {
    searchTags(searchKeyword.value)
  }, 300)
}

function loadMore() {
  page.value += 1
  hasMore.value = displayedTags.value.length < tags.value.length
}

async function refresh(): Promise<void> {
  page.value = 1
  searchKeyword.value = ''
  await fetchTags()
}

// Lifecycle
onMounted(() => {
  fetchTags()
})

// Watch for mode changes
watch(() => props.mode, () => {
  refresh()
})

// Expose methods
defineExpose({
  refresh
})
</script>

<style scoped>
.tag-selector {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

/* Search input */
.tag-search {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: var(--spacing-md);
  width: 18px;
  height: 18px;
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 40px;
  padding: var(--spacing-sm) var(--spacing-md) var(--spacing-sm) 42px;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  transition: all var(--transition-fast);
}

.search-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-light);
}

.search-input::placeholder {
  color: var(--color-text-placeholder);
}

/* Tags container */
.tags-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.tags-list {
  display: flex;
  gap: var(--spacing-sm);
  overflow-x: auto;
  padding: var(--spacing-xs) 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tags-list::-webkit-scrollbar {
  display: none;
}

.tags-wrap .tags-list {
  flex-wrap: wrap;
  overflow-x: visible;
}

/* Tag button */
.tag-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-pill);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  white-space: nowrap;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.tag-btn:hover {
  background-color: var(--color-bg-secondary);
  border-color: var(--color-border);
}

.tag-btn.tag-selected {
  background-color: var(--color-accent-light);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.tag-btn:active {
  transform: scale(0.97);
}

.tag-name {
  font-weight: var(--font-weight-medium);
}

.tag-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  background-color: var(--color-bg-elevated);
  padding: 2px 6px;
  border-radius: var(--radius-pill);
}

.tag-selected .tag-count {
  background-color: var(--color-accent);
  color: white;
}

.tag-check {
  width: 14px;
  height: 14px;
  color: var(--color-accent);
}

/* Skeleton */
.tag-skeleton {
  width: 80px;
  height: 34px;
  background: linear-gradient(
    90deg,
    var(--color-bg-tertiary) 25%,
    var(--color-bg-secondary) 50%,
    var(--color-bg-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
  border-radius: var(--radius-pill);
  flex-shrink: 0;
}

.tag-skeleton:nth-child(2) { width: 100px; }
.tag-skeleton:nth-child(3) { width: 70px; }
.tag-skeleton:nth-child(4) { width: 90px; }
.tag-skeleton:nth-child(5) { width: 60px; }
.tag-skeleton:nth-child(6) { width: 85px; }

@keyframes skeleton-pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Empty state */
.tags-empty {
  padding: var(--spacing-md);
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

/* Load more button */
.load-more-btn {
  align-self: center;
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-accent);
  transition: all var(--transition-fast);
}

.load-more-btn:hover {
  background-color: var(--color-accent-light);
}

/* Selected summary */
.selected-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--color-separator);
}

.summary-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.summary-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.summary-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background-color: var(--color-accent);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: white;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.summary-tag:hover {
  background-color: var(--color-accent-hover);
}

.summary-tag svg {
  width: 12px;
  height: 12px;
}
</style>
