/**
 * 通用帮助函数
 */

/**
 * 从标签输入文本中解析标签
 * @param input - 输入文本，格式: "#标签1 #标签2"
 * @returns 标签数组
 */
export function parseTags(input: string): string[] {
  if (!input) return []
  
  const regex = /#([^\s#]+)/g
  const matches = input.matchAll(regex)
  const tags = new Set<string>()
  
  for (const match of matches) {
    const tag = match[1].trim()
    if (tag) {
      tags.add(tag)
    }
  }
  
  return Array.from(tags)
}

/**
 * 将标签数组格式化为字符串
 * @param tags - 标签数组
 * @returns 格式化后的字符串
 */
export function formatTags(tags: string[]): string {
  if (!tags || tags.length === 0) return ''
  return tags.map(tag => `#${tag}`).join(' ')
}

/**
 * 格式化文件大小
 * @param bytes - 文件大小（字节）
 * @returns 格式化后的大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 格式化日期时间
 * @param date - 日期
 * @param format - 格式类型: 'date', 'time', 'datetime'
 * @returns 格式化后的日期时间
 */
export function formatDateTime(date: string | Date, format: 'date' | 'time' | 'datetime' = 'datetime'): string {
  if (!date) return ''
  
  const d = new Date(date)
  
  const pad = (n: number): string => n.toString().padStart(2, '0')
  
  const year = d.getFullYear()
  const month = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const hours = pad(d.getHours())
  const minutes = pad(d.getMinutes())
  
  switch (format) {
    case 'date':
      return `${year}-${month}-${day}`
    case 'time':
      return `${hours}:${minutes}`
    case 'datetime':
    default:
      return `${year}-${month}-${day} ${hours}:${minutes}`
  }
}

/**
 * 防抖函数
 * @param fn - 要执行的函数
 * @param delay - 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  
  return function (this: unknown, ...args: Parameters<T>): void {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数
 * @param fn - 要执行的函数
 * @param limit - 时间间隔（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number = 300
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return function (this: unknown, ...args: Parameters<T>): void {
    if (!inThrottle) {
      fn.apply(this, args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * 生成随机字符串
 * @param length - 字符串长度
 * @returns 随机字符串
 */
export function randomString(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 深拷贝对象
 * @param obj - 要拷贝的对象
 * @returns 拷贝后的对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T
  }
  
  const cloned = {} as T
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  return cloned
}
