import { getAuthHeaders } from '../stores/auth.js'

// 基础 API 请求函数
async function apiRequest(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers
  }

  const response = await fetch(url, {
    ...options,
    headers
  })

  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status}`)
  }

  return response.json()
}

// 书籍相关 API
export const booksAPI = {
  // 获取书籍列表
  async getBooks(params = {}) {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString())
      }
    })

    const url = `/api/books?${searchParams.toString()}`
    return apiRequest(url)
  },

  // 获取书籍详情
  async getBookDetail(bookId) {
    return apiRequest(`/api/books/${bookId}`)
  },

  // 获取书籍封面
  getCoverUrl(bookId, size = 'thumb') {
    return `/api/books/${bookId}/cover?size=${size}`
  },

  // 获取书籍下载链接
  getDownloadUrl(bookId) {
    return `/api/books/${bookId}/epub`
  },

  // 获取书籍阅读链接
  getReadUrl(bookPath, epubFile) {
    return `/bibi/?book=${encodeURIComponent(bookPath + '/' + epubFile)}`
  }
}

// 分类相关 API
export const categoriesAPI = {
  // 获取作者列表
  async getAuthors() {
    return apiRequest('/api/authors')
  },

  // 获取出版社列表
  async getPublishers() {
    return apiRequest('/api/publishers')
  },

  // 获取标签列表
  async getCategories() {
    return apiRequest('/api/categories')
  },

  // 获取丛书列表
  async getSeries(params = {}) {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString())
      }
    })

    const url = `/api/series?${searchParams.toString()}`
    return apiRequest(url)
  },

  // 获取特定丛书
  async getSeriesByName(name) {
    return apiRequest(`/api/series?name=${encodeURIComponent(name)}`)
  },

  // 获取语言列表
  async getLanguages() {
    return apiRequest('/api/languages')
  }
}

// 搜索相关 API
export const searchAPI = {
  // 搜索书籍
  async searchBooks(query, params = {}) {
    const searchParams = new URLSearchParams({
      search: query,
      ...params
    })
    
    return apiRequest(`/api/books?${searchParams.toString()}`)
  },

  // 搜索丛书
  async searchSeries(query) {
    return apiRequest(`/api/series?search=${encodeURIComponent(query)}`)
  }
}

// 工具函数
export const utils = {
  // 格式化日期
  formatDate(dateStr) {
    if (!dateStr) return '未知'
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}年${month}月${day}日`
  },

  // 格式化系列号
  formatSeriesIndex(seriesIndex) {
    if (seriesIndex === null || seriesIndex === undefined) return ''
    
    const numIndex = parseFloat(seriesIndex)
    if (isNaN(numIndex)) return seriesIndex.toString()
    
    return Number.isInteger(numIndex) ? numIndex.toString() : numIndex.toFixed(1)
  },

  // 生成标识符链接
  generateIdentifierLinks(identifiers) {
    if (!identifiers || Object.keys(identifiers).length === 0) return []
    
    const idTypeNames = {
      'isbn': 'ISBN',
      'google': 'Google',
      'mobi-asin': 'MOBI',
      'amazon': 'Amazon',
      'amazon_jp': 'Amazon'
    }
    
    return Object.entries(identifiers).map(([type, value]) => {
      let url = '#'
      switch(type) {
        case 'isbn':
          url = `https://www.worldcat.org/isbn/${encodeURIComponent(value)}`
          break
        case 'google':
          url = `https://books.google.com/books?id=${encodeURIComponent(value)}`
          break
        case 'amazon':
        case 'mobi-asin':
        case 'amazon_jp':
          url = `https://www.amazon.co.jp/dp/${encodeURIComponent(value)}`
          break
      }
      
      return {
        type,
        value,
        url,
        displayName: idTypeNames[type] || type
      }
    })
  }
}