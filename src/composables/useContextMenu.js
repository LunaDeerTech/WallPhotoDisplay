import { reactive, onMounted, onUnmounted } from 'vue'

/**
 * useContextMenu composable - 右键菜单状态管理
 * 
 * 提供统一的右键菜单控制逻辑
 */
export function useContextMenu() {
  // Menu state
  const state = reactive({
    visible: false,
    x: 0,
    y: 0,
    items: [],
    targetData: null
  })
  
  // Store click handler reference for cleanup
  let clickHandler = null
  let contextMenuHandler = null
  
  /**
   * 显示右键菜单
   * @param {MouseEvent} event - 鼠标事件
   * @param {Array} items - 菜单项数组
   * @param {any} data - 关联数据
   */
  function show(event, items, data = null) {
    // Prevent default context menu
    event.preventDefault()
    event.stopPropagation()
    
    // Calculate position with boundary detection
    const { clientX, clientY } = event
    const menuWidth = 200 // Approximate menu width
    const menuHeight = items.filter(item => !item.divider).length * 40 + items.filter(item => item.divider).length * 9
    const padding = 8
    
    let x = clientX
    let y = clientY
    
    // Check right boundary
    if (x + menuWidth + padding > window.innerWidth) {
      x = window.innerWidth - menuWidth - padding
    }
    
    // Check bottom boundary
    if (y + menuHeight + padding > window.innerHeight) {
      y = window.innerHeight - menuHeight - padding
    }
    
    // Ensure minimum position
    x = Math.max(padding, x)
    y = Math.max(padding, y)
    
    // Update state
    state.x = x
    state.y = y
    state.items = items
    state.targetData = data
    state.visible = true
  }
  
  /**
   * 隐藏右键菜单
   */
  function hide() {
    state.visible = false
    // Don't clear items immediately for smooth transition
    setTimeout(() => {
      if (!state.visible) {
        state.items = []
        state.targetData = null
      }
    }, 200)
  }
  
  /**
   * 切换右键菜单显示状态
   */
  function toggle(event, items, data = null) {
    if (state.visible) {
      hide()
    } else {
      show(event, items, data)
    }
  }
  
  /**
   * 处理菜单项点击
   * @param {Object} item - 被点击的菜单项
   * @param {Function} callback - 回调函数
   */
  function handleItemClick(item, callback) {
    if (item.disabled) return
    
    // Execute item action if provided
    if (item.action && typeof item.action === 'function') {
      item.action(state.targetData)
    }
    
    // Execute callback
    if (callback && typeof callback === 'function') {
      callback(item, state.targetData)
    }
    
    // Hide menu
    hide()
  }
  
  /**
   * 设置全局点击处理器 (点击菜单外部关闭)
   */
  function setupGlobalHandlers() {
    clickHandler = (event) => {
      // Check if click is outside menu
      const menu = document.querySelector('.context-menu')
      if (menu && !menu.contains(event.target)) {
        hide()
      }
    }
    
    contextMenuHandler = (event) => {
      // If clicking outside current menu, hide it
      const menu = document.querySelector('.context-menu')
      if (menu && !menu.contains(event.target)) {
        hide()
      }
    }
    
    document.addEventListener('click', clickHandler)
    document.addEventListener('contextmenu', contextMenuHandler)
  }
  
  /**
   * 移除全局处理器
   */
  function removeGlobalHandlers() {
    if (clickHandler) {
      document.removeEventListener('click', clickHandler)
      clickHandler = null
    }
    if (contextMenuHandler) {
      document.removeEventListener('contextmenu', contextMenuHandler)
      contextMenuHandler = null
    }
  }
  
  // Lifecycle hooks
  onMounted(() => {
    setupGlobalHandlers()
  })
  
  onUnmounted(() => {
    removeGlobalHandlers()
  })
  
  return {
    state,
    show,
    hide,
    toggle,
    handleItemClick
  }
}

/**
 * 创建菜单项的工具函数
 */
export function createMenuItem(id, label, options = {}) {
  return {
    id,
    label,
    icon: options.icon || null,
    shortcut: options.shortcut || null,
    disabled: options.disabled || false,
    danger: options.danger || false,
    action: options.action || null
  }
}

/**
 * 创建分隔线
 */
export function createDivider() {
  return { divider: true }
}

/**
 * 预定义的常用菜单项
 */
export const commonMenuItems = {
  view: () => createMenuItem('view', '查看', { icon: 'zoom-in' }),
  download: () => createMenuItem('download', '下载', { icon: 'download' }),
  edit: () => createMenuItem('edit', '编辑', { icon: 'edit' }),
  editTags: () => createMenuItem('edit-tags', '编辑标签', { icon: 'tag' }),
  delete: () => createMenuItem('delete', '删除', { icon: 'trash', danger: true }),
  copy: () => createMenuItem('copy', '复制', { icon: 'copy', shortcut: 'Ctrl+C' }),
  multiSelect: () => createMenuItem('multi-select', '多选', { icon: 'check-square' }),
  selectAll: () => createMenuItem('select-all', '全选', { icon: 'check-square', shortcut: 'Ctrl+A' }),
  info: () => createMenuItem('info', '详情', { icon: 'info' })
}

export default useContextMenu
