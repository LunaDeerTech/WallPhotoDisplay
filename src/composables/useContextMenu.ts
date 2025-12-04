import { reactive, onMounted, onUnmounted } from 'vue'

/**
 * 菜单项接口
 */
export interface MenuItem {
  id: string
  label: string
  icon?: string | null
  shortcut?: string | null
  disabled?: boolean
  danger?: boolean
  action?: ((data: unknown) => void) | null
  divider?: never
}

/**
 * 分隔线接口
 */
export interface MenuDivider {
  divider: true
}

/**
 * 菜单项或分隔线类型
 */
export type MenuItemOrDivider = MenuItem | MenuDivider

/**
 * 菜单状态接口
 */
export interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  items: MenuItemOrDivider[]
  targetData: unknown
}

/**
 * 创建菜单项的选项接口
 */
export interface MenuItemOptions {
  icon?: string | null
  shortcut?: string | null
  disabled?: boolean
  danger?: boolean
  action?: ((data: unknown) => void) | null
}

/**
 * useContextMenu composable 返回类型
 */
export interface UseContextMenuReturn {
  state: ContextMenuState
  show: (event: MouseEvent, items: MenuItemOrDivider[], data?: unknown) => void
  hide: () => void
  toggle: (event: MouseEvent, items: MenuItemOrDivider[], data?: unknown) => void
  handleItemClick: (item: MenuItem, callback?: (item: MenuItem, data: unknown) => void) => void
}

/**
 * useContextMenu composable - 右键菜单状态管理
 * 
 * 提供统一的右键菜单控制逻辑
 */
export function useContextMenu(): UseContextMenuReturn {
  // Menu state
  const state = reactive<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    items: [],
    targetData: null
  })
  
  // Store click handler reference for cleanup
  let clickHandler: ((event: MouseEvent) => void) | null = null
  let contextMenuHandler: ((event: MouseEvent) => void) | null = null
  
  /**
   * 显示右键菜单
   */
  function show(event: MouseEvent, items: MenuItemOrDivider[], data: unknown = null): void {
    // Prevent default context menu
    event.preventDefault()
    event.stopPropagation()
    
    // Calculate position with boundary detection
    const { clientX, clientY } = event
    const menuWidth = 200 // Approximate menu width
    const menuHeight = items.filter(item => !('divider' in item)).length * 40 + 
                       items.filter(item => 'divider' in item).length * 9
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
  function hide(): void {
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
  function toggle(event: MouseEvent, items: MenuItemOrDivider[], data: unknown = null): void {
    if (state.visible) {
      hide()
    } else {
      show(event, items, data)
    }
  }
  
  /**
   * 处理菜单项点击
   */
  function handleItemClick(
    item: MenuItem, 
    callback?: (item: MenuItem, data: unknown) => void
  ): void {
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
  function setupGlobalHandlers(): void {
    clickHandler = (event: MouseEvent) => {
      // Check if click is outside menu
      const menu = document.querySelector('.context-menu')
      if (menu && !menu.contains(event.target as Node)) {
        hide()
      }
    }
    
    contextMenuHandler = (event: MouseEvent) => {
      // If clicking outside current menu, hide it
      const menu = document.querySelector('.context-menu')
      if (menu && !menu.contains(event.target as Node)) {
        hide()
      }
    }
    
    document.addEventListener('click', clickHandler)
    document.addEventListener('contextmenu', contextMenuHandler)
  }
  
  /**
   * 移除全局处理器
   */
  function removeGlobalHandlers(): void {
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
export function createMenuItem(
  id: string, 
  label: string, 
  options: MenuItemOptions = {}
): MenuItem {
  return {
    id,
    label,
    icon: options.icon ?? null,
    shortcut: options.shortcut ?? null,
    disabled: options.disabled ?? false,
    danger: options.danger ?? false,
    action: options.action ?? null
  }
}

/**
 * 创建分隔线
 */
export function createDivider(): MenuDivider {
  return { divider: true }
}

/**
 * 预定义的常用菜单项
 */
export const commonMenuItems = {
  view: (): MenuItem => createMenuItem('view', '查看', { icon: 'zoom-in' }),
  download: (): MenuItem => createMenuItem('download', '下载', { icon: 'download' }),
  edit: (): MenuItem => createMenuItem('edit', '编辑', { icon: 'edit' }),
  editTags: (): MenuItem => createMenuItem('edit-tags', '编辑标签', { icon: 'tag' }),
  delete: (): MenuItem => createMenuItem('delete', '删除', { icon: 'trash', danger: true }),
  copy: (): MenuItem => createMenuItem('copy', '复制', { icon: 'copy', shortcut: 'Ctrl+C' }),
  multiSelect: (): MenuItem => createMenuItem('multi-select', '多选', { icon: 'check-square' }),
  selectAll: (): MenuItem => createMenuItem('select-all', '全选', { icon: 'check-square', shortcut: 'Ctrl+A' }),
  info: (): MenuItem => createMenuItem('info', '详情', { icon: 'info' })
}

export default useContextMenu
