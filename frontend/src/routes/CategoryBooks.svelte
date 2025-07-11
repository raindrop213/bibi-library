<script>
  import { onMount, createEventDispatcher } from 'svelte'
  import { currentRoute } from '../stores/router.js'
  import { searchQuery, currentSort } from '../stores/ui.js'
  import { navigateTo } from '../stores/router.js'
  import { booksAPI, categoriesAPI } from '../services/api.js'
  import BookGrid from '../components/BookGrid.svelte'
  
  const dispatch = createEventDispatcher()
  
  let books = []
  let hasMore = false
  let currentPage = 1
  let loading = false
  let lastSearch = ''
  let lastSort = ''
  let categoryInfo = null
  
  $: routeParts = $currentRoute.split('/')
  $: categoryType = routeParts[0]
  $: categoryName = decodeURIComponent(routeParts[1] || '')
  
  onMount(() => {
    loadCategoryInfo()
  })
  
  // 监听路由变化
  $: {
    if ($currentRoute) {
      loadCategoryInfo()
    }
  }
  
  // 监听搜索和排序变化
  $: {
    if ($searchQuery !== lastSearch || $currentSort !== lastSort) {
      lastSearch = $searchQuery
      lastSort = $currentSort
      if (categoryInfo) {
        resetAndLoadBooks()
      }
    }
  }
  
  async function loadCategoryInfo() {
    if (!categoryType || !categoryName) return
    
    try {
      // 根据分类类型获取分类信息
      let response
      switch(categoryType) {
        case 'series':
          response = await categoriesAPI.getSeriesByName(categoryName)
          categoryInfo = response
          break
        case 'categories':
          response = await categoriesAPI.getCategories()
          categoryInfo = response.categories.find(c => c.name === categoryName)
          break
        case 'authors':
          response = await categoriesAPI.getAuthors()
          categoryInfo = response.authors.find(c => c.name === categoryName)
          break
        case 'publishers':
          response = await categoriesAPI.getPublishers()
          categoryInfo = response.publishers.find(c => c.name === categoryName)
          break
        case 'languages':
          response = await categoriesAPI.getLanguages()
          categoryInfo = response.languages.find(c => c.lang_code === categoryName)
          break
      }
      
      if (categoryInfo) {
        resetAndLoadBooks()
      }
    } catch (error) {
      console.error('加载分类信息失败:', error)
    }
  }
  
  async function loadBooks(page = 1) {
    if (loading || !categoryInfo) return
    
    loading = true
    
    try {
      const params = {
        page,
        sort: $currentSort,
        section: 'books'
      }
      
      // 根据分类类型添加过滤参数
      switch(categoryType) {
        case 'series':
          params.series = categoryInfo.id
          break
        case 'categories':
          params.categories = categoryInfo.id
          break
        case 'authors':
          params.authors = categoryInfo.id
          break
        case 'publishers':
          params.publishers = categoryInfo.id
          break
        case 'languages':
          params.languages = categoryInfo.id
          break
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
  
  function handleBreadcrumbClick() {
    navigateTo(categoryType)
  }
  
  const typeNames = {
    series: '丛书',
    categories: '分类',
    authors: '作者',
    publishers: '出版',
    languages: '语言'
  }
</script>

<div class="category-books-container">
  {#if categoryInfo}
    <div class="category-header">
      <div class="breadcrumb">
        <span class="breadcrumb-item" on:click={handleBreadcrumbClick}>
          {typeNames[categoryType]}
        </span>
        <span class="breadcrumb-separator">></span>
        <span class="breadcrumb-current">{categoryName}</span>
      </div>
      
      {#if categoryInfo.book_count}
        <div class="category-stats">
          共 {categoryInfo.book_count} 本书
        </div>
      {/if}
    </div>
    
    <div class="books-content">
      <BookGrid 
        {books} 
        {hasMore} 
        {loading}
        showSeriesIndex={categoryType === 'series'}
        on:bookSelect={handleBookSelect}
        on:loadMore={handleLoadMore}
      />
    </div>
  {:else if loading}
    <div class="loading">
      <i class="bi bi-arrow-repeat"></i>
      <span>正在加载...</span>
    </div>
  {:else}
    <div class="no-results">
      <i class="bi bi-exclamation-triangle"></i>
      <p>未找到该分类</p>
    </div>
  {/if}
</div>

<style>
  .category-books-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .category-header {
    padding: 20px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-secondary);
  }
  
  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }
  
  .breadcrumb-item {
    cursor: pointer;
    transition: var(--transition);
  }
  
  .breadcrumb-item:hover {
    color: var(--accent);
  }
  
  .breadcrumb-separator {
    color: var(--text-muted);
  }
  
  .breadcrumb-current {
    color: var(--text-primary);
    font-weight: 600;
  }
  
  .category-stats {
    font-size: 14px;
    color: var(--text-secondary);
  }
  
  .books-content {
    flex: 1;
    overflow: hidden;
  }
  
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 40px;
    color: var(--text-secondary);
  }
  
  .loading i {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .no-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 60px 20px;
    color: var(--text-muted);
    text-align: center;
  }
  
  .no-results i {
    font-size: 48px;
    opacity: 0.5;
  }
  
  .no-results p {
    font-size: 16px;
    margin: 0;
  }
  
  @media (max-width: 768px) {
    .category-header {
      padding: 16px;
    }
    
    .breadcrumb {
      font-size: 14px;
    }
    
    .category-stats {
      font-size: 12px;
    }
  }
</style>