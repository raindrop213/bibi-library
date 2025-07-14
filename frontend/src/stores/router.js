import { writable } from 'svelte/store'

export const currentRoute = writable('books')

// 路由导航函数
export function navigateTo(route) {
  currentRoute.set(route)
  window.location.hash = route
}

// 解析路由参数
export function parseRoute(route) {
  const parts = route.split('/')
  return {
    page: parts[0],
    category: parts[1] || null,
    params: parts.slice(2)
  }
}