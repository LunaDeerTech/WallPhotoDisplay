<template>
  <div class="tag-input-container">
    <!-- Tags display -->
    <div class="tag-input-wrapper" @click="focusInput">
      <TransitionGroup name="tag" tag="div" class="tags-list">
        <span
          v-for="tag in modelValue"
          :key="tag"
          class="tag-item"
        >
          <span class="tag-text">#{{ tag }}</span>
          <button
            type="button"
            class="tag-remove-btn"
            @click.stop="removeTag(tag)"
            :aria-label="`移除标签 ${tag}`"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </span>
      </TransitionGroup>
      
      <!-- Input field -->
      <input
        ref="inputRef"
        v-model="inputValue"
        type="text"
        class="tag-input"
        :placeholder="modelValue.length === 0 ? placeholder : ''"
        @keydown="handleKeydown"
        @input="handleInput"
        @blur="handleBlur"
        @focus="isFocused = true"
      />
    </div>

    <!-- Hint text -->
    <p v-if="hint && isFocused" class="tag-hint">
      {{ hint }}
    </p>

    <!-- Autocomplete suggestions -->
    <Transition name="dropdown">
      <div
        v-if="showSuggestions && suggestions.length > 0"
        class="tag-suggestions"
      >
        <button
          v-for="suggestion in suggestions"
          :key="suggestion.id || suggestion.name"
          type="button"
          class="tag-suggestion-item"
          @mousedown.prevent="selectSuggestion(suggestion)"
        >
          <span class="suggestion-name">#{{ suggestion.name }}</span>
          <span v-if="suggestion.count !== undefined" class="suggestion-count">
            {{ suggestion.count }}
          </span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import tagsApi from '../../api/tags.js'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: '输入 #标签名 添加标签'
  },
  hint: {
    type: String,
    default: '输入 # 开头的标签，空格确认'
  },
  maxTags: {
    type: Number,
    default: 20
  },
  allowCreate: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'tag-added', 'tag-removed'])

// Refs
const inputRef = ref(null)
const inputValue = ref('')
const isFocused = ref(false)
const suggestions = ref([])
const searchDebounceTimer = ref(null)

// Computed
const showSuggestions = computed(() => {
  return isFocused.value && inputValue.value.startsWith('#') && inputValue.value.length > 1
})

// Focus the input
function focusInput() {
  inputRef.value?.focus()
}

// Parse tags from input text
function parseTags(input) {
  const regex = /#([^\s#]+)/g
  const matches = input.matchAll(regex)
  const tags = new Set()
  
  for (const match of matches) {
    const tag = match[1].trim()
    if (tag) {
      tags.add(tag)
    }
  }
  
  return Array.from(tags)
}

// Handle input changes
function handleInput() {
  // Check if we should search for suggestions
  if (inputValue.value.startsWith('#') && inputValue.value.length > 1) {
    const keyword = inputValue.value.slice(1) // Remove #
    debouncedSearch(keyword)
  } else {
    suggestions.value = []
  }
  
  // Check for completed tags (ended with space)
  if (inputValue.value.endsWith(' ')) {
    const tags = parseTags(inputValue.value)
    if (tags.length > 0) {
      addTags(tags)
      inputValue.value = ''
      suggestions.value = []
    }
  }
}

// Debounced search
function debouncedSearch(keyword) {
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value)
  }
  
  searchDebounceTimer.value = setTimeout(async () => {
    try {
      const response = await tagsApi.searchTags(keyword, 5)
      if (response.success) {
        // Filter out already selected tags
        suggestions.value = response.data.filter(
          tag => !props.modelValue.includes(tag.name)
        )
      }
    } catch (error) {
      console.error('Search tags error:', error)
    }
  }, 200)
}

// Handle keydown events
function handleKeydown(event) {
  // Backspace to remove last tag when input is empty
  if (event.key === 'Backspace' && inputValue.value === '' && props.modelValue.length > 0) {
    const lastTag = props.modelValue[props.modelValue.length - 1]
    removeTag(lastTag)
    return
  }
  
  // Enter to confirm tag
  if (event.key === 'Enter') {
    event.preventDefault()
    const tags = parseTags(inputValue.value)
    if (tags.length > 0) {
      addTags(tags)
      inputValue.value = ''
      suggestions.value = []
    } else if (inputValue.value.trim() && props.allowCreate) {
      // If no # prefix, treat whole input as a tag
      const tagName = inputValue.value.trim().replace(/^#/, '')
      if (tagName) {
        addTags([tagName])
        inputValue.value = ''
        suggestions.value = []
      }
    }
    return
  }
  
  // Tab to select first suggestion
  if (event.key === 'Tab' && suggestions.value.length > 0) {
    event.preventDefault()
    selectSuggestion(suggestions.value[0])
  }
}

// Handle blur
function handleBlur() {
  // Delay to allow suggestion click
  setTimeout(() => {
    isFocused.value = false
    
    // Confirm any pending tags
    const tags = parseTags(inputValue.value)
    if (tags.length > 0) {
      addTags(tags)
      inputValue.value = ''
    }
    suggestions.value = []
  }, 150)
}

// Add tags
function addTags(tags) {
  if (props.modelValue.length >= props.maxTags) return
  
  const newTags = tags.filter(tag => !props.modelValue.includes(tag))
  if (newTags.length === 0) return
  
  const availableSlots = props.maxTags - props.modelValue.length
  const tagsToAdd = newTags.slice(0, availableSlots)
  
  const updatedTags = [...props.modelValue, ...tagsToAdd]
  emit('update:modelValue', updatedTags)
  
  tagsToAdd.forEach(tag => {
    emit('tag-added', tag)
  })
}

// Remove a tag
function removeTag(tag) {
  const updatedTags = props.modelValue.filter(t => t !== tag)
  emit('update:modelValue', updatedTags)
  emit('tag-removed', tag)
  
  // Re-focus input after removing
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// Select a suggestion
function selectSuggestion(suggestion) {
  addTags([suggestion.name])
  inputValue.value = ''
  suggestions.value = []
  
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// Expose methods
defineExpose({
  focus: focusInput
})
</script>

<style scoped>
.tag-input-container {
  position: relative;
  width: 100%;
}

.tag-input-wrapper {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-xs);
  min-height: 44px;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  cursor: text;
  transition: all var(--transition-fast);
}

.tag-input-wrapper:focus-within {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-light);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--color-accent-light);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  color: var(--color-accent);
  user-select: none;
}

.tag-text {
  font-weight: var(--font-weight-medium);
}

.tag-remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border-radius: var(--radius-round);
  color: var(--color-accent);
  opacity: 0.7;
  transition: all var(--transition-fast);
}

.tag-remove-btn:hover {
  opacity: 1;
  background-color: var(--color-accent);
  color: white;
}

.tag-remove-btn svg {
  width: 12px;
  height: 12px;
}

.tag-input {
  flex: 1;
  min-width: 120px;
  height: 28px;
  padding: 0;
  background: transparent;
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
}

.tag-input::placeholder {
  color: var(--color-text-placeholder);
}

.tag-hint {
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* Suggestions dropdown */
.tag-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: var(--z-dropdown);
  margin-top: var(--spacing-xs);
  padding: var(--spacing-xs);
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  max-height: 200px;
  overflow-y: auto;
}

.tag-suggestion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  text-align: left;
  transition: background-color var(--transition-fast);
}

.tag-suggestion-item:hover {
  background-color: var(--color-bg-tertiary);
}

.suggestion-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.suggestion-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  background-color: var(--color-bg-tertiary);
  padding: 2px 8px;
  border-radius: var(--radius-pill);
}

/* Tag transitions */
.tag-enter-active,
.tag-leave-active {
  transition: all 0.2s ease;
}

.tag-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.tag-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.tag-move {
  transition: transform 0.2s ease;
}

/* Dropdown transitions */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
