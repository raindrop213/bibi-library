<script>
  import { onMount } from 'svelte'
  import { categoriesAPI } from '../services/api.js'
  import { searchQuery } from '../stores/ui.js'
  import { navigateTo } from '../stores/router.js'
  
  export let categoryType = 'categories'
  
  let categories = []
  let filteredCategories = []
  let loading = false
  
  const apiMap = {
    categories: categoriesAPI.getCategories,
    authors: categoriesAPI.getAuthors,
    publishers: categoriesAPI.getPublishers,
    languages: categoriesAPI.getLanguages
  }
  
  const iconMap = {
    categories: 'bi-tags',
    authors: 'bi-person-fill',
    publishers: 'bi-shop-window',
    languages: 'bi-translate'
  }
  
  onMount(() => {
    loadCategories()
  })
  
  // 监听搜索变化
  $: {
    if ($searchQuery) {
      filteredCategories = categories.filter(cat => 
        cat.name.toLowerCase().includes($searchQuery.toLowerCase())
      )
    } else {
      filteredCategories = [...categories]
    }
  }
  
  async function loadCategories() {
    if (loading) return
    
    loading = true
    
    try {
      const apiFunc = apiMap[categoryType]
      if (apiFunc) {
        const response = await apiFunc()
        categories = response[categoryType] || []
      }
    } catch (error) {
      console.error(`加载${categoryType}失败:`, error)
    } finally {
      loading = false
    }
  }
  
  function handleCategoryClick(category) {
    navigateTo(`${categoryType}/${encodeURIComponent(category.name)}`)
  }
</script>

<div class="category-container">
  {#if filteredCategories.length > 0}
    <div class="category-grid">
      {#each filteredCategories as category (category.id)}
        <div class="category-card" on:click={() => handleCategoryClick(category)}>
          <div class="category-icon">
            <i class="bi {iconMap[categoryType]}"></i>
          </div>
          <div class="category-info">
            <div class="category-name" title={category.name}>{category.name}</div>
            <div class="category-count">{category.book_count} 本书</div>
          </div>
        </div>
      {/each}
    </div>
  {:else if loading}
    <div class="loading">
      <i class="bi bi-arrow-repeat"></i>
      <span>正在加载分类...</span>
    </div>
  {:else}
    <div class="no-results">
      <i class="bi {iconMap[categoryType]}"></i>
      <p>没有找到分类</p>
    </div>
  {/if}
</div>

<style>
  .category-container {
    width: 100%;
    height: 100%;
    overflow-y: auto;
  }
  
  .category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 16px;
    padding: 20px;
  }
  
  .category-card {
    background: var(--bg-secondary);
    border-radius: var(--radius);
    padding: 16px;
    cursor: pointer;
    transition: var(--transition);
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .category-card:hover {
    background: var(--bg-tertiary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--shadow);
  }
  
  .category-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
    flex-shrink: 0;
  }
  
  .category-info {
    flex: 1;
    min-width: 0;
  }
  
  .category-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .category-count {
    font-size: 14px;
    color: var(--text-secondary);
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
    .category-grid {
      grid-template-columns: 1fr;
      gap: 12px;
      padding: 16px;
    }
    
    .category-card {
      padding: 12px;
    }
    
    .category-icon {
      width: 40px;
      height: 40px;
      font-size: 16px;
    }
    
    .category-name {
      font-size: 14px;
    }
    
    .category-count {
      font-size: 12px;
    }
  }
</style>