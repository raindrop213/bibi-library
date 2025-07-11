import { writable } from 'svelte/store'

// 收藏书籍状态
export const favoriteBooks = writable([])

// 初始化收藏列表
export function initializeFavorites() {
  const saved = localStorage.getItem('favoriteBooks')
  if (saved) {
    favoriteBooks.set(JSON.parse(saved))
  }
}

// 添加到收藏
export function addToFavorites(book) {
  favoriteBooks.update(favorites => {
    const exists = favorites.find(b => b.id === book.id)
    if (!exists) {
      const newFavorites = [...favorites, {
        ...book,
        date_added: new Date().toISOString()
      }]
      localStorage.setItem('favoriteBooks', JSON.stringify(newFavorites))
      return newFavorites
    }
    return favorites
  })
}

// 从收藏中移除
export function removeFromFavorites(bookId) {
  favoriteBooks.update(favorites => {
    const newFavorites = favorites.filter(b => b.id !== bookId)
    localStorage.setItem('favoriteBooks', JSON.stringify(newFavorites))
    return newFavorites
  })
}

// 检查是否已收藏
export function isFavorite(bookId) {
  let favorites = []
  favoriteBooks.subscribe(f => favorites = f)()
  return favorites.some(b => b.id === bookId)
}

// 初始化
initializeFavorites()