<script>
  import { currentRoute, navigateTo } from '../stores/router.js'
  
  const navItems = [
    { id: 'books', icon: 'bi-book', label: '书籍' },
    { id: 'favorites', icon: 'bi-bookmarks', label: '收藏' },
    { id: 'series', icon: 'bi-collection', label: '丛书' },
    { id: 'categories', icon: 'bi-tags', label: '分类' },
    { id: 'authors', icon: 'bi-person-fill', label: '作者' },
    { id: 'publishers', icon: 'bi-shop-window', label: '出版' },
    { id: 'languages', icon: 'bi-translate', label: '语言' }
  ]
  
  function handleNavClick(itemId) {
    navigateTo(itemId)
  }
  
  function handleLogoClick() {
    navigateTo('books')
  }
</script>

<div class="sidebar">
  <div class="sidebar-header" on:click={handleLogoClick}>
    <div class="sidebar-title">RD2BOOKSHELF</div>
  </div>
  
  <nav class="nav">
    {#each navItems as item}
      <div 
        class="nav-item" 
        class:active={$currentRoute === item.id || $currentRoute.startsWith(item.id + '/')}
        on:click={() => handleNavClick(item.id)}
      >
        <i class="bi {item.icon}"></i>
        <span>{item.label}</span>
      </div>
    {/each}
  </nav>
</div>

<style>
  .sidebar {
    width: 240px;
    background: var(--bg-secondary);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }
  
  .sidebar-header {
    padding: 20px;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    transition: var(--transition);
  }
  
  .sidebar-header:hover {
    background: var(--bg-tertiary);
  }
  
  .sidebar-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    text-align: center;
  }
  
  .nav {
    flex: 1;
    padding: 20px 0;
  }
  
  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    cursor: pointer;
    transition: var(--transition);
    color: var(--text-secondary);
  }
  
  .nav-item:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }
  
  .nav-item.active {
    background: var(--accent);
    color: white;
  }
  
  .nav-item i {
    font-size: 16px;
    width: 20px;
    text-align: center;
  }
  
  .nav-item span {
    font-size: 14px;
    font-weight: 500;
  }
  
  @media (max-width: 768px) {
    .sidebar {
      width: 60px;
    }
    
    .sidebar-title {
      font-size: 12px;
    }
    
    .nav-item span {
      display: none;
    }
    
    .nav-item {
      justify-content: center;
      padding: 12px;
    }
  }
</style>