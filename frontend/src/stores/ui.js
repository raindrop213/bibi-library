import { writable } from 'svelte/store'

// UI 状态
export const isLoading = writable(false)
export const searchQuery = writable('')
export const currentSort = writable('date-desc')
export const currentSection = writable('books')
export const showFullscreenCover = writable(false)
export const fullscreenCoverUrl = writable('')

// 设置加载状态
export function setLoading(loading) {
  isLoading.set(loading)
}

// 设置搜索查询
export function setSearchQuery(query) {
  searchQuery.set(query)
}

// 设置排序方式
export function setSort(sort) {
  currentSort.set(sort)
}

// 显示全屏封面
export function showCover(url) {
  fullscreenCoverUrl.set(url)
  showFullscreenCover.set(true)
}

// 隐藏全屏封面
export function hideCover() {
  showFullscreenCover.set(false)
  fullscreenCoverUrl.set('')
}