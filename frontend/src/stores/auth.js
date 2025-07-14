import { writable } from 'svelte/store'

// 访问密码状态
export const accessPassword = writable(localStorage.getItem('accessPassword') || '')

// 设置密码
export function setPassword(password) {
  localStorage.setItem('accessPassword', password)
  accessPassword.set(password)
}

// 获取带密码的请求头
export function getAuthHeaders() {
  let password = ''
  accessPassword.subscribe(p => password = p)()
  
  return password ? { 'X-Access-Password': password } : {}
}