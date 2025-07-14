<script>
  import { createEventDispatcher } from 'svelte'
  import BookCard from './BookCard.svelte'
  import { isLoading } from '../stores/ui.js'
  
  export let books = []
  export let showSeriesIndex = false
  export let hasMore = false
  export let loading = false
  
  const dispatch = createEventDispatcher()
  
  function handleBookSelect(event) {
    dispatch('bookSelect', event.detail)
  }
  
  function handleLoadMore() {
    if (!loading && hasMore) {
      dispatch('loadMore')
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

<div class="book-grid-container" bind:this={scrollContainer} on:scroll={handleScroll}>
  {#if books.length > 0}
    <div class="book-grid">
      {#each books as book (book.id)}
        <BookCard 
          {book} 
          {showSeriesIndex}
          on:select={handleBookSelect}
        />
      {/each}
    </div>
    
    {#if loading}
      <div class="loading">
        <i class="bi bi-arrow-repeat"></i>
        <span>正在加载更多书籍...</span>
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
      <span>正在加载书籍...</span>
    </div>
  {:else}
    <div class="no-results">
      <i class="bi bi-book"></i>
      <p>没有找到书籍</p>
    </div>
  {/if}
</div>

<style>
  .book-grid-container {
    width: 100%;
    height: 100%;
    overflow-y: auto;
  }
  
  .book-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 20px;
    padding: 20px;
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
    .book-grid {
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 16px;
      padding: 16px;
    }
  }
  
  @media (max-width: 480px) {
    .book-grid {
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 12px;
      padding: 12px;
    }
  }
</style>