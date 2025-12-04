import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

/**
 * useWaterfall composable - 瀑布流布局计算
 * 
 * 提供真正的瀑布流布局算法，将项目放置在最短的列中
 * 支持两种模式：
 * 1. DOM-based: 基于实际DOM元素进行布局计算
 * 2. Data-based: 基于图片数据（宽高比）进行预计算
 */
export function useWaterfall(options = {}) {
  const {
    containerRef = null,        // 容器元素引用
    columns = ref(4),           // 列数
    gap = 16,                   // 间距
    itemSelector = '.waterfall-item',  // 项目选择器
    resizeDebounce = 100        // resize 防抖延迟
  } = options
  
  // State
  const columnHeights = ref([])
  const containerHeight = ref(0)
  const itemPositions = ref(new Map())
  const isCalculating = ref(false)
  const columnWidthValue = ref(0)
  
  // Computed
  const columnWidth = computed(() => {
    if (!containerRef?.value) return columnWidthValue.value
    const containerWidth = containerRef.value.clientWidth
    const totalGap = gap * (columns.value - 1)
    columnWidthValue.value = (containerWidth - totalGap) / columns.value
    return columnWidthValue.value
  })
  
  /**
   * 获取最短列的索引
   */
  function getShortestColumnIndex() {
    if (columnHeights.value.length === 0) return 0
    const minHeight = Math.min(...columnHeights.value)
    return columnHeights.value.indexOf(minHeight)
  }
  
  /**
   * 获取最长列的索引
   */
  function getTallestColumnIndex() {
    if (columnHeights.value.length === 0) return 0
    const maxHeight = Math.max(...columnHeights.value)
    return columnHeights.value.indexOf(maxHeight)
  }
  
  /**
   * 初始化列高度数组
   */
  function initColumnHeights() {
    columnHeights.value = new Array(columns.value).fill(0)
  }
  
  /**
   * 计算单个项目的位置（基于宽高比）
   * @param {Object} item - 图片数据对象，包含 width 和 height
   * @param {string|number} itemId - 项目ID
   * @returns {Object} 位置信息 { x, y, width, height, columnIndex }
   */
  function calculateItemPosition(item, itemId = null) {
    const width = columnWidth.value
    const columnIndex = getShortestColumnIndex()
    const x = columnIndex * (width + gap)
    const y = columnHeights.value[columnIndex]
    
    // 基于宽高比计算高度
    let itemHeight
    if (item && item.width && item.height) {
      itemHeight = (item.height / item.width) * width
    } else if (typeof item === 'number') {
      // 如果传入的是高度数值
      itemHeight = item
    } else {
      // 默认 4:3 比例
      itemHeight = width * 0.75
    }
    
    // Update column height
    columnHeights.value[columnIndex] += itemHeight + gap
    
    const position = { x, y, width, height: itemHeight, columnIndex }
    
    if (itemId !== null) {
      itemPositions.value.set(itemId, position)
    }
    
    // Update container height
    containerHeight.value = Math.max(...columnHeights.value)
    
    return position
  }
  
  /**
   * 基于数据计算所有项目的布局（不依赖DOM）
   * @param {Array} items - 图片数据数组，每项包含 id, width, height
   * @returns {Map} 位置映射 Map<id, position>
   */
  function calculateLayoutFromData(items) {
    if (!items || items.length === 0) {
      itemPositions.value.clear()
      containerHeight.value = 0
      return itemPositions.value
    }
    
    // 确保列宽已计算
    if (containerRef?.value) {
      const containerWidth = containerRef.value.clientWidth
      const totalGap = gap * (columns.value - 1)
      columnWidthValue.value = (containerWidth - totalGap) / columns.value
    }
    
    // Reset
    initColumnHeights()
    itemPositions.value.clear()
    
    // Calculate positions for each item
    items.forEach(item => {
      const id = item.id
      calculateItemPosition(item, id)
    })
    
    return itemPositions.value
  }
  
  /**
   * 计算所有项目的布局（基于DOM）
   */
  function calculateLayout() {
    if (!containerRef?.value || isCalculating.value) return
    
    isCalculating.value = true
    
    // Reset column heights
    initColumnHeights()
    itemPositions.value.clear()
    
    const container = containerRef.value
    const items = container.querySelectorAll(itemSelector)
    
    if (items.length === 0) {
      containerHeight.value = 0
      isCalculating.value = false
      return
    }
    
    const width = columnWidth.value
    
    items.forEach((item, index) => {
      // Get item dimensions
      const itemElement = item
      
      // If item has data-id attribute, use it
      const itemId = itemElement.dataset.id || index
      
      // Calculate height based on aspect ratio or actual height
      let itemHeight = itemElement.offsetHeight
      
      // If item is not rendered yet, estimate based on image aspect ratio
      if (itemHeight === 0) {
        const img = itemElement.querySelector('img')
        if (img && img.naturalWidth && img.naturalHeight) {
          itemHeight = (img.naturalHeight / img.naturalWidth) * width
        } else {
          itemHeight = width * 0.75 // Default 4:3 aspect ratio
        }
      }
      
      // Calculate position - pass height as number
      const columnIndex = getShortestColumnIndex()
      const x = columnIndex * (width + gap)
      const y = columnHeights.value[columnIndex]
      
      // Update column height
      columnHeights.value[columnIndex] += itemHeight + gap
      
      const position = { x, y, width, height: itemHeight, columnIndex }
      itemPositions.value.set(itemId, position)
      
      // Apply position to element
      itemElement.style.position = 'absolute'
      itemElement.style.left = `${position.x}px`
      itemElement.style.top = `${position.y}px`
      itemElement.style.width = `${position.width}px`
    })
    
    // Set container height
    containerHeight.value = Math.max(...columnHeights.value)
    container.style.height = `${containerHeight.value}px`
    container.style.position = 'relative'
    
    isCalculating.value = false
  }
  
  /**
   * 添加新项目到布局
   */
  function addItem(itemElement, itemId = null, itemData = null) {
    if (!containerRef?.value) return null
    
    const width = columnWidth.value
    let itemHeight = itemElement.offsetHeight
    
    // 优先使用传入的数据计算高度
    if (itemData && itemData.width && itemData.height) {
      itemHeight = (itemData.height / itemData.width) * width
    } else if (itemHeight === 0) {
      const img = itemElement.querySelector('img')
      if (img && img.naturalWidth && img.naturalHeight) {
        itemHeight = (img.naturalHeight / img.naturalWidth) * width
      } else {
        itemHeight = width * 0.75
      }
    }
    
    // Calculate position
    const columnIndex = getShortestColumnIndex()
    const x = columnIndex * (width + gap)
    const y = columnHeights.value[columnIndex]
    
    columnHeights.value[columnIndex] += itemHeight + gap
    
    const position = { x, y, width, height: itemHeight, columnIndex }
    
    if (itemId !== null) {
      itemPositions.value.set(itemId, position)
    }
    
    // Apply position
    itemElement.style.position = 'absolute'
    itemElement.style.left = `${position.x}px`
    itemElement.style.top = `${position.y}px`
    itemElement.style.width = `${position.width}px`
    
    // Update container height
    containerHeight.value = Math.max(...columnHeights.value)
    if (containerRef.value) {
      containerRef.value.style.height = `${containerHeight.value}px`
    }
    
    return position
  }
  
  /**
   * 移除项目并重新计算布局
   */
  function removeItem(itemId) {
    itemPositions.value.delete(itemId)
    // Full recalculation needed after removal
    nextTick(() => {
      calculateLayout()
    })
  }
  
  /**
   * 获取项目位置
   */
  function getItemPosition(itemId) {
    return itemPositions.value.get(itemId) || null
  }
  
  /**
   * 重置布局
   */
  function reset() {
    columnHeights.value = new Array(columns.value).fill(0)
    itemPositions.value.clear()
    containerHeight.value = 0
    
    if (containerRef?.value) {
      containerRef.value.style.height = '0px'
    }
  }
  
  // Debounced resize handler
  let resizeTimer = null
  function handleResize() {
    if (resizeTimer) {
      clearTimeout(resizeTimer)
    }
    resizeTimer = setTimeout(() => {
      calculateLayout()
    }, resizeDebounce)
  }
  
  // Setup resize observer
  let resizeObserver = null
  
  function setupResizeObserver() {
    if (!containerRef?.value || typeof ResizeObserver === 'undefined') return
    
    resizeObserver = new ResizeObserver(() => {
      handleResize()
    })
    
    resizeObserver.observe(containerRef.value)
  }
  
  function destroyResizeObserver() {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
  }
  
  // Watch for column changes
  watch(columns, () => {
    nextTick(() => {
      calculateLayout()
    })
  })
  
  // Lifecycle
  onMounted(() => {
    if (containerRef?.value) {
      setupResizeObserver()
      nextTick(() => {
        calculateLayout()
      })
    }
  })
  
  onUnmounted(() => {
    destroyResizeObserver()
    if (resizeTimer) {
      clearTimeout(resizeTimer)
    }
  })
  
  return {
    // State
    columnHeights,
    containerHeight,
    itemPositions,
    columnWidth,
    isCalculating,
    
    // Methods
    calculateLayout,
    calculateLayoutFromData,
    calculateItemPosition,
    initColumnHeights,
    addItem,
    removeItem,
    getItemPosition,
    getShortestColumnIndex,
    getTallestColumnIndex,
    reset,
    
    // Setup
    setupResizeObserver,
    destroyResizeObserver
  }
}

/**
 * 简化版瀑布流 - 使用 CSS columns
 * 适用于简单场景，性能更好但布局控制较弱
 */
export function useCSSWaterfall(columns = ref(4), gap = 16) {
  const containerStyle = computed(() => ({
    columnCount: columns.value,
    columnGap: `${gap}px`
  }))
  
  const itemStyle = {
    breakInside: 'avoid',
    pageBreakInside: 'avoid',
    marginBottom: `${gap}px`
  }
  
  return {
    containerStyle,
    itemStyle
  }
}

export default useWaterfall
