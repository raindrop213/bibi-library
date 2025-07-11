<script>
  import { createEventDispatcher } from 'svelte'
  import { currentRoute } from '../stores/router.js'
  import { searchQuery, currentSort, setSearchQuery, setSort } from '../stores/ui.js'
  
  const dispatch = createEventDispatcher()
  
  const pageNames = {
    books: '书籍',
    favorites: '收藏',
    series: '丛书',
    categories: '分类',
    authors: '作者',
    publishers: '出版',
    languages: '语言'
  }
  
  const sortOptions = [
    { value: 'date-desc', icon: 'bi-clock-history', icon2: 'bi-sort-numeric-down-alt', title: '添加时间倒序' },
    { value: 'date-asc', icon: 'bi-clock-history', icon2: 'bi-sort-numeric-down', title: '添加时间顺序' },
    { value: 'title-asc', icon: 'bi-fonts', icon2: 'bi-sort-alpha-down', title: '标题顺序' },
    { value: 'title-desc', icon: 'bi-fonts', icon2: 'bi-sort-alpha-down-alt', title: '标题倒序' },
    { value: 'author-asc', icon: 'bi-person-fill', icon2: 'bi-sort-alpha-down', title: '作者顺序' },
    { value: 'author-desc', icon: 'bi-person-fill', icon2: 'bi-sort-alpha-down-alt', title: '作者倒序' },
    { value: 'pubdate-desc', icon: 'bi-calendar4-event', icon2: 'bi-sort-numeric-down-alt', title: '出版日期倒序' },
    { value: 'pubdate-asc', icon: 'bi-calendar4-event', icon2: 'bi-sort-numeric-down', title: '出版日期顺序' },
    { value: 'random', icon: 'bi-shuffle', title: '随机排序' }
  ]
  
  let searchInput = ''
  let searchTimeout
  
  $: pageTitle = getPageTitle($currentRoute)
  $: showSortButtons = $currentRoute === 'books' || $currentRoute === 'favorites'
  
  function getPageTitle(route) {
    if (route.includes('/')) {
      const parts = route.split('/')
      const basePage = parts[0]
      const category = decodeURIComponent(parts[1] || '')
      return `${pageNames[basePage]} > ${category}`
    }
    return pageNames[route] || '书籍'
  }
  
  function handleSearchInput() {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 300)
  }
  
  function handleSortChange(sort) {
    setSort(sort)
  }
  
  function handleAboutClick() {
    dispatch('showAbout')
  }
</script>

<div class="header">
  <div class="page-title">{pageTitle}</div>
  
  <div class="header-actions">
    <div class="search-bar">
      <i class="bi bi-search"></i>
      <input 
        type="text" 
        placeholder="搜索..." 
        bind:value={searchInput}
        on:input={handleSearchInput}
      />
    </div>
    
    <button class="about-button" on:click={handleAboutClick} title="关于">
      <i class="bi bi-info-circle"></i>
    </button>
  </div>
</div>

{#if showSortButtons}
  <div class="sort-buttons">
    {#each sortOptions as option}
      <button 
        class="sort-button" 
        class:active={$currentSort === option.value}
        on:click={() => handleSortChange(option.value)}
        title={option.title}
      >
        <i class="bi {option.icon}"></i>
        {#if option.icon2}
          <i class="bi {option.icon2}"></i>
        {/if}
      </button>
    {/each}
  </div>
{/if}

<style>
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-secondary);
  }
  
  .page-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .search-bar {
    display: flex;
    align-items: center;
    background: var(--bg-tertiary);
    border-radius: var(--radius);
    padding: 8px 12px;
    gap: 8px;
    border: 1px solid var(--border);
    transition: var(--transition);
  }
  
  .search-bar:focus-within {
    border-color: var(--accent);
  }
  
  .search-bar i {
    color: var(--text-muted);
    font-size: 14px;
  }
  
  .search-bar input {
    background: none;
    border: none;
    color: var(--text-primary);
    font-size: 14px;
    outline: none;
    width: 200px;
  }
  
  .search-bar input::placeholder {
    color: var(--text-muted);
  }
  
  .about-button {
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 18px;
    cursor: pointer;
    padding: 8px;
    border-radius: var(--radius);
    transition: var(--transition);
  }
  
  .about-button:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }
  
  .sort-buttons {
    display: flex;
    gap: 8px;
    padding: 16px 20px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border);
    overflow-x: auto;
  }
  
  .sort-button {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 12px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--text-secondary);
    cursor: pointer;
    transition: var(--transition);
    white-space: nowrap;
  }
  
  .sort-button:hover {
    background: #4a4a4a;
    color: var(--text-primary);
  }
  
  .sort-button.active {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
  }
  
  .sort-button i {
    font-size: 14px;
  }
  
  @media (max-width: 768px) {
    .header {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;
    }
    
    .page-title {
      font-size: 18px;
    }
    
    .header-actions {
      justify-content: space-between;
    }
    
    .search-bar input {
      width: 150px;
    }
    
    .sort-buttons {
      padding: 12px 16px;
    }
  }
</style>