<script>
  import { onMount, createEventDispatcher } from 'svelte'
  import BookGrid from '../components/BookGrid.svelte'
  import { booksAPI } from '../services/api.js'
  import { searchQuery, currentSort, isLoading } from '../stores/ui.js'
  
  const dispatch = createEventDispatcher()
  
  let books = []
  let hasMore = false
  let currentPage = 1
  let loading = false
  let lastSearch = ''
  let lastSort = ''
  
  onMount(() => {
    loadBooks()
  })
  
  // 监听搜索和排序变化
  $: {
    if ($searchQuery !== lastSearch || $currentSort !== lastSort) {
      lastSearch = $searchQuery
      lastSort = $currentSort
      resetAndLoadBooks()
    }
  }
  
  async function loadBooks(page = 1) {
    if (loading) return
    
    loading = true
    
    try {
      const params = {
        page,
        sort: $currentSort,
        section: 'books'
      }
      
      if ($searchQuery) {
        params.search = $searchQuery
      }
      
      const response = await booksAPI.getBooks(params)
      
      if (page === 1) {
        books = response.books || []
      } else {
        books = [...books, ...(response.books || [])]
      }
      
      hasMore = response.hasMore || false
      currentPage = response.page || page
      
    } catch (error) {
      console.error('加载书籍失败:', error)
    } finally {
      loading = false
    }
  }
  
  async function resetAndLoadBooks() {
    books = []
    currentPage = 1
    hasMore = false
    await loadBooks(1)
  }
  
  function handleBookSelect(event) {
    dispatch('bookSelect', event.detail)
  }
  
  function handleLoadMore() {
    if (!loading && hasMore) {
      loadBooks(currentPage + 1)
    }
  }
</script>

<BookGrid 
  {books} 
  {hasMore} 
  {loading}
  on:bookSelect={handleBookSelect}
  on:loadMore={handleLoadMore}
/>