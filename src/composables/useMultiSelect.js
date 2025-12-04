import { ref, computed, watch } from 'vue'

/**
 * useMultiSelect composable - 多选功能
 * 
 * 提供统一的多选逻辑，支持:
 * - 单击选择/取消选择
 * - Shift 键范围选择
 * - Ctrl/Cmd 键添加选择
 * - 全选/取消全选
 */
export function useMultiSelect(options = {}) {
  const {
    itemKey = 'id',          // 用于唯一标识项目的键
    onSelectionChange = null  // 选择变化回调
  } = options
  
  // State
  const isSelectionMode = ref(false)
  const selectedItems = ref(new Set())
  const lastSelectedIndex = ref(-1)
  const allItems = ref([])
  
  // Computed
  const selectedCount = computed(() => selectedItems.value.size)
  const hasSelection = computed(() => selectedItems.value.size > 0)
  const isAllSelected = computed(() => {
    return allItems.value.length > 0 && selectedItems.value.size === allItems.value.length
  })
  const selectedIds = computed(() => Array.from(selectedItems.value))
  
  /**
   * 获取项目的唯一标识
   */
  function getItemId(item) {
    return typeof item === 'object' ? item[itemKey] : item
  }
  
  /**
   * 检查项目是否被选中
   */
  function isSelected(item) {
    const id = getItemId(item)
    return selectedItems.value.has(id)
  }
  
  /**
   * 切换单个项目的选中状态
   */
  function toggleSelect(item, event = null) {
    const id = getItemId(item)
    const itemIndex = allItems.value.findIndex(i => getItemId(i) === id)
    
    // Handle Shift+Click for range selection
    if (event?.shiftKey && lastSelectedIndex.value !== -1 && itemIndex !== -1) {
      const start = Math.min(lastSelectedIndex.value, itemIndex)
      const end = Math.max(lastSelectedIndex.value, itemIndex)
      
      for (let i = start; i <= end; i++) {
        const rangeItem = allItems.value[i]
        if (rangeItem) {
          selectedItems.value.add(getItemId(rangeItem))
        }
      }
    }
    // Handle Ctrl/Cmd+Click for adding to selection
    else if (event?.ctrlKey || event?.metaKey) {
      if (selectedItems.value.has(id)) {
        selectedItems.value.delete(id)
      } else {
        selectedItems.value.add(id)
      }
    }
    // Normal click - toggle single item
    else {
      if (selectedItems.value.has(id)) {
        selectedItems.value.delete(id)
      } else {
        selectedItems.value.add(id)
      }
    }
    
    // Update last selected index
    lastSelectedIndex.value = itemIndex
    
    // Trigger change callback
    notifySelectionChange()
  }
  
  /**
   * 选择单个项目
   */
  function select(item) {
    const id = getItemId(item)
    selectedItems.value.add(id)
    notifySelectionChange()
  }
  
  /**
   * 取消选择单个项目
   */
  function deselect(item) {
    const id = getItemId(item)
    selectedItems.value.delete(id)
    notifySelectionChange()
  }
  
  /**
   * 选择多个项目
   */
  function selectMultiple(items) {
    items.forEach(item => {
      selectedItems.value.add(getItemId(item))
    })
    notifySelectionChange()
  }
  
  /**
   * 取消选择多个项目
   */
  function deselectMultiple(items) {
    items.forEach(item => {
      selectedItems.value.delete(getItemId(item))
    })
    notifySelectionChange()
  }
  
  /**
   * 全选
   */
  function selectAll() {
    allItems.value.forEach(item => {
      selectedItems.value.add(getItemId(item))
    })
    notifySelectionChange()
  }
  
  /**
   * 取消全选
   */
  function deselectAll() {
    selectedItems.value.clear()
    lastSelectedIndex.value = -1
    notifySelectionChange()
  }
  
  /**
   * 切换全选状态
   */
  function toggleSelectAll() {
    if (isAllSelected.value) {
      deselectAll()
    } else {
      selectAll()
    }
  }
  
  /**
   * 反选
   */
  function invertSelection() {
    const newSelection = new Set()
    allItems.value.forEach(item => {
      const id = getItemId(item)
      if (!selectedItems.value.has(id)) {
        newSelection.add(id)
      }
    })
    selectedItems.value = newSelection
    notifySelectionChange()
  }
  
  /**
   * 进入选择模式
   */
  function enterSelectionMode() {
    isSelectionMode.value = true
  }
  
  /**
   * 退出选择模式
   */
  function exitSelectionMode() {
    isSelectionMode.value = false
    deselectAll()
  }
  
  /**
   * 切换选择模式
   */
  function toggleSelectionMode() {
    if (isSelectionMode.value) {
      exitSelectionMode()
    } else {
      enterSelectionMode()
    }
  }
  
  /**
   * 设置所有可选项目
   */
  function setAllItems(items) {
    allItems.value = items
    
    // Remove selections for items that no longer exist
    const validIds = new Set(items.map(getItemId))
    const toRemove = []
    selectedItems.value.forEach(id => {
      if (!validIds.has(id)) {
        toRemove.push(id)
      }
    })
    toRemove.forEach(id => selectedItems.value.delete(id))
    
    if (toRemove.length > 0) {
      notifySelectionChange()
    }
  }
  
  /**
   * 获取选中的项目对象
   */
  function getSelectedItems() {
    return allItems.value.filter(item => selectedItems.value.has(getItemId(item)))
  }
  
  /**
   * 通知选择变化
   */
  function notifySelectionChange() {
    if (onSelectionChange && typeof onSelectionChange === 'function') {
      onSelectionChange({
        selectedIds: selectedIds.value,
        selectedItems: getSelectedItems(),
        count: selectedCount.value
      })
    }
  }
  
  /**
   * 重置所有状态
   */
  function reset() {
    selectedItems.value.clear()
    lastSelectedIndex.value = -1
    isSelectionMode.value = false
    allItems.value = []
  }
  
  // Watch for selection mode changes
  watch(isSelectionMode, (newValue) => {
    if (!newValue) {
      deselectAll()
    }
  })
  
  return {
    // State
    isSelectionMode,
    selectedItems,
    selectedIds,
    selectedCount,
    hasSelection,
    isAllSelected,
    
    // Methods
    isSelected,
    toggleSelect,
    select,
    deselect,
    selectMultiple,
    deselectMultiple,
    selectAll,
    deselectAll,
    toggleSelectAll,
    invertSelection,
    
    // Mode control
    enterSelectionMode,
    exitSelectionMode,
    toggleSelectionMode,
    
    // Data management
    setAllItems,
    getSelectedItems,
    reset
  }
}

export default useMultiSelect
