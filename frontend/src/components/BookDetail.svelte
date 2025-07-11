<script>
  import { onMount, createEventDispatcher } from 'svelte'
  import { booksAPI, utils } from '../services/api.js'
  import { addToFavorites, removeFromFavorites, isFavorite } from '../stores/favorites.js'
  import { navigateTo } from '../stores/router.js'
  import { showCover } from '../stores/ui.js'
  
  export let bookId
  
  const dispatch = createEventDispatcher()
  
  let book = null
  let loading = false
  let favorited = false
  
  onMount(() => {
    loadBookDetail()
  })
  
  $: favorited = book ? isFavorite(book.id) : false
  
  async function loadBookDetail() {
    if (!bookId) return
    
    loading = true
    
    try {
      book = await booksAPI.getBookDetail(bookId)
    } catch (error) {
      console.error('加载书籍详情失败:', error)
    } finally {
      loading = false
    }
  }
  
  function handleClose() {
    dispatch('close')
  }
  
  function handleDownload() {
    if (book) {
      window.location.href = booksAPI.getDownloadUrl(book.id)
    }
  }
  
  function handleRead() {
    if (book && book.epub_file) {
      window.location.href = booksAPI.getReadUrl(book.path, book.epub_file)
    }
  }
  
  function handleAudiobook() {
    if (book && book.audiobook) {
      window.open(book.audiobook.url, '_blank')
    }
  }
  
  function handleFavorite() {
    if (!book) return
    
    if (favorited) {
      removeFromFavorites(book.id)
    } else {
      addToFavorites(book)
    }
  }
  
  function handleCoverClick() {
    if (book && book.cover_url) {
      showCover(book.cover_url.replace('?size=thumb', ''))
    }
  }
  
  function handleTagClick(tag) {
    dispatch('close')
    navigateTo(`categories/${encodeURIComponent(tag)}`)
  }
  
  function handleAuthorClick(author) {
    dispatch('close')
    navigateTo(`authors/${encodeURIComponent(author)}`)
  }
  
  function handlePublisherClick(publisher) {
    dispatch('close')
    navigateTo(`publishers/${encodeURIComponent(publisher)}`)
  }
  
  function handleSeriesClick(series) {
    dispatch('close')
    navigateTo(`series/${encodeURIComponent(series)}`)
  }
  
  function handleOverlayClick(event) {
    if (event.target === event.currentTarget) {
      handleClose()
    }
  }
  
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      handleClose()
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="modal-overlay" on:click={handleOverlayClick}>
  <div class="modal-container">
    <div class="modal-header">
      <div class="modal-title">
        {book ? book.title : '加载中...'}
      </div>
      
      <div class="modal-actions">
        {#if book?.audiobook}
          <button 
            class="modal-action-button audiobook-button" 
            on:click={handleAudiobook}
            title="有声书"
          >
            <i class="bi bi-file-earmark-music"></i>
          </button>
        {/if}
        
        {#if book}
          <button 
            class="modal-action-button download-button" 
            on:click={handleDownload}
            title="下载 EPUB"
          >
            <i class="bi bi-file-earmark-arrow-down"></i>
          </button>
          
          <button 
            class="modal-action-button favorite-button" 
            class:favorited
            on:click={handleFavorite}
            title={favorited ? '取消收藏' : '收藏'}
          >
            <i class="bi {favorited ? 'bi-bookmark-check-fill' : 'bi-bookmark-plus'}"></i>
          </button>
          
          <button 
            class="modal-action-button read-button" 
            on:click={handleRead}
            title="阅读"
          >
            <i class="bi bi-book"></i>
          </button>
        {/if}
        
        <button 
          class="modal-action-button close-button" 
          on:click={handleClose}
          title="关闭"
        >
          <i class="bi bi-x"></i>
        </button>
      </div>
    </div>
    
    <div class="book-detail-content">
      {#if loading}
        <div class="loading">
          <i class="bi bi-arrow-repeat"></i>
          <span>正在加载书籍详情...</span>
        </div>
      {:else if book}
        <div class="book-detail-layout">
          <div class="book-detail-cover">
            <div class="cover-container" on:click={handleCoverClick}>
              <img 
                src={book.cover_url || '/images/loading.svg'} 
                alt={book.title}
                class="detail-cover-img"
              />
              <div class="cover-zoom-btn" title="查看大图">
                <i class="bi bi-arrows-fullscreen"></i>
              </div>
            </div>
          </div>
          
          <div class="book-detail-info">
            <div class="book-detail-header">
              <h1 class="detail-title">{book.title}</h1>
              <div class="detail-authors">
                {#if book.authors}
                  {#each book.authors as author, index}
                    <span class="author-link" on:click={() => handleAuthorClick(author)}>
                      {author}
                    </span>
                    {#if index < book.authors.length - 1}
                      <span class="author-separator">；</span>
                    {/if}
                  {/each}
                {/if}
              </div>
            </div>
            
            <div class="detail-meta">
              {#if book.series}
                <div class="meta-item">
                  <span class="meta-label">系列</span>
                  <span class="meta-value">
                    <span class="series-link" on:click={() => handleSeriesClick(book.series)}>
                      {book.series}
                    </span>
                    {#if book.series_index}
                      <span class="series-index">{utils.formatSeriesIndex(book.series_index)}</span>
                    {/if}
                  </span>
                </div>
              {/if}
              
              {#if book.publisher}
                <div class="meta-item">
                  <span class="meta-label">出版商</span>
                  <span class="meta-value">
                    <span class="publisher-link" on:click={() => handlePublisherClick(book.publisher)}>
                      {book.publisher}
                    </span>
                  </span>
                </div>
              {/if}
              
              <div class="meta-item">
                <span class="meta-label">出版日期</span>
                <span class="meta-value">{utils.formatDate(book.pubdate)}</span>
              </div>
              
              {#if book.identifiers && Object.keys(book.identifiers).length > 0}
                <div class="meta-item">
                  <span class="meta-label">标识符</span>
                  <div class="meta-value">
                    {#each utils.generateIdentifierLinks(book.identifiers) as identifier}
                      <span 
                        class="identifier-tag {identifier.type}" 
                        on:click={() => window.open(identifier.url, '_blank')}
                      >
                        {identifier.displayName}
                      </span>
                    {/each}
                  </div>
                </div>
              {/if}
              
              <div class="meta-item">
                <span class="meta-label">标签</span>
                <div class="meta-value">
                  {#if book.tags && book.tags.length > 0}
                    {#each book.tags as tag}
                      <span class="tag" on:click={() => handleTagClick(tag)}>
                        {tag}
                      </span>
                    {/each}
                  {:else}
                    <span class="no-tags">无</span>
                  {/if}
                </div>
              </div>
            </div>
            
            {#if book.comment}
              <div class="detail-description">
                <div class="description-content">
                  {@html book.comment}
                </div>
              </div>
            {/if}
            
            <div class="book-id-display">
              # {book.id}
            </div>
          </div>
        </div>
      {:else}
        <div class="error-message">
          <i class="bi bi-exclamation-triangle"></i>
          <p>加载书籍详情失败</p>
          <button class="btn" on:click={loadBookDetail}>重试</button>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }
  
  .modal-container {
    background: var(--bg-secondary);
    border-radius: var(--radius);
    max-width: 90vw;
    max-height: 90vh;
    width: 100%;
    max-width: 800px;
    overflow: hidden;
    box-shadow: 0 10px 30px var(--shadow);
  }
  
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    border-bottom: 1px solid var(--border);
  }
  
  .modal-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    flex: 1;
    margin-right: 20px;
    line-height: 1.4;
  }
  
  .modal-actions {
    display: flex;
    gap: 8px;
  }
  
  .modal-action-button {
    width: 40px;
    height: 40px;
    border: none;
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    border-radius: var(--radius);
    cursor: pointer;
    transition: var(--transition);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .modal-action-button:hover {
    background: #4a4a4a;
    color: var(--text-primary);
  }
  
  .modal-action-button.read-button {
    background: var(--accent);
    color: white;
  }
  
  .modal-action-button.read-button:hover {
    background: var(--accent-hover);
  }
  
  .modal-action-button.favorite-button.favorited {
    background: var(--warning);
    color: white;
  }
  
  .modal-action-button.audiobook-button {
    background: var(--success);
    color: white;
  }
  
  .book-detail-content {
    max-height: calc(90vh - 100px);
    overflow-y: auto;
  }
  
  .book-detail-layout {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 24px;
    padding: 24px;
  }
  
  .book-detail-cover {
    position: sticky;
    top: 0;
  }
  
  .cover-container {
    position: relative;
    cursor: pointer;
    border-radius: var(--radius);
    overflow: hidden;
    transition: var(--transition);
  }
  
  .cover-container:hover {
    transform: scale(1.05);
  }
  
  .detail-cover-img {
    width: 100%;
    height: auto;
    display: block;
  }
  
  .cover-zoom-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    padding: 4px;
    border-radius: 4px;
    opacity: 0;
    transition: var(--transition);
  }
  
  .cover-container:hover .cover-zoom-btn {
    opacity: 1;
  }
  
  .book-detail-info {
    min-width: 0;
  }
  
  .book-detail-header {
    margin-bottom: 24px;
  }
  
  .detail-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 8px 0;
    line-height: 1.3;
  }
  
  .detail-authors {
    font-size: 16px;
    color: var(--text-secondary);
  }
  
  .author-link {
    cursor: pointer;
    transition: var(--transition);
  }
  
  .author-link:hover {
    color: var(--accent);
  }
  
  .author-separator {
    margin: 0 4px;
  }
  
  .detail-meta {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
  }
  
  .meta-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }
  
  .meta-label {
    font-weight: 600;
    color: var(--text-secondary);
    min-width: 80px;
    font-size: 14px;
  }
  
  .meta-value {
    flex: 1;
    color: var(--text-primary);
    font-size: 14px;
    line-height: 1.4;
  }
  
  .series-link, .publisher-link {
    cursor: pointer;
    color: var(--accent);
    transition: var(--transition);
  }
  
  .series-link:hover, .publisher-link:hover {
    color: var(--accent-hover);
  }
  
  .series-index {
    margin-left: 8px;
    background: var(--accent);
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 12px;
  }
  
  .identifier-tag {
    display: inline-block;
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: var(--transition);
    margin-right: 8px;
    margin-bottom: 4px;
  }
  
  .identifier-tag:hover {
    background: var(--accent);
    color: white;
  }
  
  .tag {
    display: inline-block;
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: var(--transition);
    margin-right: 8px;
    margin-bottom: 4px;
  }
  
  .tag:hover {
    background: var(--accent);
    color: white;
  }
  
  .no-tags {
    color: var(--text-muted);
    font-style: italic;
  }
  
  .detail-description {
    background: var(--bg-tertiary);
    padding: 16px;
    border-radius: var(--radius);
    margin-bottom: 24px;
  }
  
  .description-content {
    line-height: 1.6;
    color: var(--text-primary);
  }
  
  .book-id-display {
    font-size: 12px;
    color: var(--text-muted);
    text-align: right;
    margin-top: 16px;
  }
  
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 60px;
    color: var(--text-secondary);
  }
  
  .loading i {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .error-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 60px;
    text-align: center;
  }
  
  .error-message i {
    font-size: 48px;
    color: var(--error);
  }
  
  .error-message p {
    font-size: 16px;
    color: var(--text-secondary);
    margin: 0;
  }
  
  @media (max-width: 768px) {
    .modal-container {
      max-width: 95vw;
      max-height: 95vh;
    }
    
    .modal-header {
      padding: 16px;
    }
    
    .modal-title {
      font-size: 16px;
    }
    
    .modal-actions {
      gap: 4px;
    }
    
    .modal-action-button {
      width: 36px;
      height: 36px;
    }
    
    .book-detail-layout {
      grid-template-columns: 1fr;
      gap: 16px;
      padding: 16px;
    }
    
    .book-detail-cover {
      max-width: 200px;
      margin: 0 auto;
    }
    
    .detail-title {
      font-size: 20px;
    }
  }
</style>