<script>
  import { onMount } from 'svelte'
  import { categoriesAPI } from '../services/api.js'
  import { searchQuery } from '../stores/ui.js'
  import { navigateTo } from '../stores/router.js'
  
  let series = []
  let hasMore = false
  let currentPage = 1
  let loading = false
  let lastSearch = ''
  
  onMount(() => {
    loadSeries()
  })
  
  // 监听搜索变化
  $: {
    if ($searchQuery !== lastSearch) {
      lastSearch = $searchQuery
      resetAndLoadSeries()
    }
  }
  
  async function loadSeries(page = 1) {
    if (loading) return
    
    loading = true
    
    try {
      const params = { page }
      
      if ($searchQuery) {
        params.search = $searchQuery
      }
      
      const response = await categoriesAPI.getSeries(params)
      
      if (page === 1) {
        series = response.series || []
      } else {
        series = [...series, ...(response.series || [])]
      }
      
      hasMore = response.hasMore || false
      currentPage = response.page || page
      
    } catch (error) {
      console.error('加载丛书失败:', error)
    } finally {
      loading = false
    }
  }
  
  async function resetAndLoadSeries() {
    series = []
    currentPage = 1
    hasMore = false
    await loadSeries(1)
  }
  
  function handleSeriesClick(item) {
    navigateTo(`series/${encodeURIComponent(item.name)}`)
  }
  
  function handleLoadMore() {
    if (!loading && hasMore) {
      loadSeries(currentPage + 1)
    }
  }
  
  // 无限滚动检测
  let scrollContainer
  
  function handleScroll() {
    if (!scrollContainer || loading || !hasMore) return
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer
    const scrollThreshold = scrollHeight - clientHeight - 200
    
    if (scrollTop >= scrollThreshold) {
      handleLoadMore()
    }
  }
</script>

<div class="series-container" bind:this={scrollContainer} on:scroll={handleScroll}>
  {#if series.length > 0}
    <div class="series-grid">
      {#each series as item (item.id)}
        <div class="series-card" on:click={() => handleSeriesClick(item)}>
          <div class="series-cover">
            {#if item.cover_url}
              <img 
                src={item.cover_url} 
                alt={item.name}
                loading="lazy"
              />
            {:else}
              <div class="series-placeholder">
                <i class="bi bi-book"></i>
              </div>
            {/if}
            <div class="book-count-badge">{item.book_count}</div>
          </div>
          
          <div class="series-info">
            <div class="series-title" title={item.name}>{item.name}</div>
          </div>
        </div>
      {/each}
    </div>
    
    {#if loading}
      <div class="loading">
        <i class="bi bi-arrow-repeat"></i>
        <span>正在加载更多丛书...</span>
      </div>
    {/if}
    
    {#if hasMore && !loading}
      <div class="load-more-section">
        <button class="btn" on:click={handleLoadMore}>
          加载更多
        </button>
      </div>
    {/if}
  {:else if loading}
    <div class="loading">
      <i class="bi bi-arrow-repeat"></i>
      <span>正在加载丛书...</span>
    </div>
  {:else}
    <div class="no-results">
      <i class="bi bi-collection"></i>
      <p>没有找到丛书系列</p>
    </div>
  {/if}
</div>

<style>
  .series-container {
    width: 100%;
    height: 100%;
    overflow-y: auto;
  }
  
  .series-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 20px;
    padding: 20px;
  }
  
  .series-card {
    background: var(--bg-secondary);
    border-radius: var(--radius);
    overflow: hidden;
    cursor: pointer;
    transition: var(--transition);
    border: 1px solid var(--border);
  }
  
  .series-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--shadow);
  }
  
  .series-cover {
    position: relative;
    width: 100%;
    aspect-ratio: 3/4;
    overflow: hidden;
    background: var(--bg-tertiary);
  }
  
  .series-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: var(--transition);
  }
  
  .series-card:hover .series-cover img {
    transform: scale(1.05);
  }
  
  .series-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    font-size: 48px;
  }
  
  .book-count-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: var(--accent);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }
  
  .series-info {
    padding: 12px;
  }
  
  .series-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
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
  
  .load-more-section {
    display: flex;
    justify-content: center;
    padding: 20px;
  }
  
  @media (max-width: 768px) {
    .series-grid {
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 16px;
      padding: 16px;
    }
  }
  
  @media (max-width: 480px) {
    .series-grid {
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 12px;
      padding: 12px;
    }
  }
</style>