import { ref, computed, watch, onMounted, onUnmounted, nextTick, type Ref, type ComputedRef } from 'vue'

/**
 * 项目位置接口
 */
export interface ItemPosition {
  x: number
  y: number
  width: number
  height: number
  columnIndex: number
}

/**
 * 瀑布流项目数据接口（用于基于数据的布局计算）
 */
export interface WaterfallItemData {
  id: string | number
  width?: number
  height?: number
  [key: string]: unknown
}

/**
 * useWaterfall 选项接口
 */
export interface UseWaterfallOptions {
  containerRef?: Ref<HTMLElement | null> | null
  columns?: Ref<number>
  gap?: number
  itemSelector?: string
  resizeDebounce?: number
}

/**
 * useWaterfall composable 返回类型
 */
export interface UseWaterfallReturn {
  // State
  columnHeights: Ref<number[]>
  containerHeight: Ref<number>
  itemPositions: Ref<Map<string | number, ItemPosition>>
  columnWidth: ComputedRef<number>
  isCalculating: Ref<boolean>
  
  // Methods
  calculateLayout: () => void
  calculateLayoutFromData: (items: WaterfallItemData[]) => Map<string | number, ItemPosition>
  calculateItemPosition: (item: WaterfallItemData | number, itemId?: string | number | null) => ItemPosition
  initColumnHeights: () => void
  addItem: (
    itemElement: HTMLElement, 
    itemId?: string | number | null, 
    itemData?: WaterfallItemData | null
  ) => ItemPosition | null
  removeItem: (itemId: string | number) => void
  getItemPosition: (itemId: string | number) => ItemPosition | null
  getShortestColumnIndex: () => number
  getTallestColumnIndex: () => number
  reset: () => void
  
  // Setup
  setupResizeObserver: () => void
  destroyResizeObserver: () => void
}

/**
 * CSS 瀑布流返回类型
 */
export interface UseCSSWaterfallReturn {
  containerStyle: ComputedRef<{ columnCount: number; columnGap: string }>
  itemStyle: { breakInside: string; pageBreakInside: string; marginBottom: string }
}

/**
 * useWaterfall composable - 瀑布流布局计算
 * 
 * 提供真正的瀑布流布局算法，将项目放置在最短的列中
 * 支持两种模式：
 * 1. DOM-based: 基于实际DOM元素进行布局计算
 * 2. Data-based: 基于图片数据（宽高比）进行预计算
 */
export function useWaterfall(options: UseWaterfallOptions = {}): UseWaterfallReturn {
  const {
    containerRef = null,
    columns = ref(4),
    gap = 16,
    itemSelector = '.waterfall-item',
    resizeDebounce = 100
  } = options
  
  // State
  const columnHeights = ref<number[]>([])
  const containerHeight = ref(0)
  const itemPositions = ref<Map<string | number, ItemPosition>>(new Map())
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
  function getShortestColumnIndex(): number {
    if (columnHeights.value.length === 0) return 0
    const minHeight = Math.min(...columnHeights.value)
    return columnHeights.value.indexOf(minHeight)
  }
  
  /**
   * 获取最长列的索引
   */
  function getTallestColumnIndex(): number {
    if (columnHeights.value.length === 0) return 0
    const maxHeight = Math.max(...columnHeights.value)
    return columnHeights.value.indexOf(maxHeight)
  }
  
  /**
   * 初始化列高度数组
   */
  function initColumnHeights(): void {
    columnHeights.value = new Array(columns.value).fill(0)
  }
  
  /**
   * 计算单个项目的位置（基于宽高比）
   */
  function calculateItemPosition(
    item: WaterfallItemData | number, 
    itemId: string | number | null = null
  ): ItemPosition {
    const width = columnWidth.value
    const columnIndex = getShortestColumnIndex()
    const x = columnIndex * (width + gap)
    const y = columnHeights.value[columnIndex]
    
    // 基于宽高比计算高度
    let itemHeight: number
    if (typeof item === 'object' && item !== null && item.width && item.height) {
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
    
    const position: ItemPosition = { x, y, width, height: itemHeight, columnIndex }
    
    if (itemId !== null) {
      itemPositions.value.set(itemId, position)
    }
    
    // Update container height
    containerHeight.value = Math.max(...columnHeights.value)
    
    return position
  }
  
  /**
   * 基于数据计算所有项目的布局（不依赖DOM）
   */
  function calculateLayoutFromData(items: WaterfallItemData[]): Map<string | number, ItemPosition> {
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
  function calculateLayout(): void {
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
      const itemElement = item as HTMLElement
      
      // If item has data-id attribute, use it
      const itemId: string | number = itemElement.dataset.id || index
      
      // Calculate height based on aspect ratio or actual height
      let itemHeight = itemElement.offsetHeight
      
      // If item is not rendered yet, estimate based on image aspect ratio
      if (itemHeight === 0) {
        const img = itemElement.querySelector('img') as HTMLImageElement | null
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
      
      const position: ItemPosition = { x, y, width, height: itemHeight, columnIndex }
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
  function addItem(
    itemElement: HTMLElement, 
    itemId: string | number | null = null, 
    itemData: WaterfallItemData | null = null
  ): ItemPosition | null {
    if (!containerRef?.value) return null
    
    const width = columnWidth.value
    let itemHeight = itemElement.offsetHeight
    
    // 优先使用传入的数据计算高度
    if (itemData && itemData.width && itemData.height) {
      itemHeight = (itemData.height / itemData.width) * width
    } else if (itemHeight === 0) {
      const img = itemElement.querySelector('img') as HTMLImageElement | null
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
    
    const position: ItemPosition = { x, y, width, height: itemHeight, columnIndex }
    
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
  function removeItem(itemId: string | number): void {
    itemPositions.value.delete(itemId)
    // Full recalculation needed after removal
    nextTick(() => {
      calculateLayout()
    })
  }
  
  /**
   * 获取项目位置
   */
  function getItemPosition(itemId: string | number): ItemPosition | null {
    return itemPositions.value.get(itemId) || null
  }
  
  /**
   * 重置布局
   */
  function reset(): void {
    columnHeights.value = new Array(columns.value).fill(0)
    itemPositions.value.clear()
    containerHeight.value = 0
    
    if (containerRef?.value) {
      containerRef.value.style.height = '0px'
    }
  }
  
  // Debounced resize handler
  let resizeTimer: ReturnType<typeof setTimeout> | null = null
  function handleResize(): void {
    if (resizeTimer) {
      clearTimeout(resizeTimer)
    }
    resizeTimer = setTimeout(() => {
      calculateLayout()
    }, resizeDebounce)
  }
  
  // Setup resize observer
  let resizeObserver: ResizeObserver | null = null
  
  function setupResizeObserver(): void {
    if (!containerRef?.value || typeof ResizeObserver === 'undefined') return
    
    resizeObserver = new ResizeObserver(() => {
      handleResize()
    })
    
    resizeObserver.observe(containerRef.value)
  }
  
  function destroyResizeObserver(): void {
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
export function useCSSWaterfall(
  columns: Ref<number> = ref(4), 
  gap: number = 16
): UseCSSWaterfallReturn {
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
