<script>
  import { createEventDispatcher } from 'svelte'
  import { booksAPI, utils } from '../services/api.js'
  import { navigateTo } from '../stores/router.js'
  
  export let book
  export let showSeriesIndex = false
  
  const dispatch = createEventDispatcher()
  
  function handleClick() {
    dispatch('select', { bookId: book.id })
  }
  
  function handleAuthorClick(event, authorName) {
    event.stopPropagation()
    navigateTo(`authors/${encodeURIComponent(authorName)}`)
  }
  
  function formatAuthors(authors) {
    if (!authors) return ''
    if (Array.isArray(authors)) {
      return authors.join('；')
    }
    return authors
  }
</script>

<div class="book-card" on:click={handleClick}>
  <div class="cover-container">
    {#if showSeriesIndex && book.series_index}
      <div class="series-index-badge">
        {utils.formatSeriesIndex(book.series_index)}
      </div>
    {/if}
    
    <img 
      src={book.cover_url || '/images/loading.svg'} 
      alt={book.title}
      class="book-cover"
      loading="lazy"
    />
  </div>
  
  <div class="book-info">
    <div class="book-title" title={book.title}>{book.title}</div>
    
    <div class="book-authors">
      {#if Array.isArray(book.author || book.authors)}
        {#each (book.author || book.authors) as author, index}
          <span 
            class="author-link"
            on:click={(e) => handleAuthorClick(e, author)}
          >
            {author}
          </span>
          {#if index < (book.author || book.authors).length - 1}
            <span class="author-separator">；</span>
          {/if}
        {/each}
      {:else if book.author || book.authors}
        <span 
          class="author-link"
          on:click={(e) => handleAuthorClick(e, book.author || book.authors)}
        >
          {book.author || book.authors}
        </span>
      {/if}
    </div>
  </div>
</div>

<style>
  .book-card {
    background: var(--bg-secondary);
    border-radius: var(--radius);
    overflow: hidden;
    cursor: pointer;
    transition: var(--transition);
    border: 1px solid var(--border);
  }
  
  .book-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--shadow);
  }
  
  .cover-container {
    position: relative;
    width: 100%;
    aspect-ratio: 3/4;
    overflow: hidden;
    background: var(--bg-tertiary);
  }
  
  .series-index-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: var(--accent);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    z-index: 1;
  }
  
  .book-cover {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: var(--transition);
  }
  
  .book-card:hover .book-cover {
    transform: scale(1.05);
  }
  
  .book-info {
    padding: 12px;
  }
  
  .book-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 8px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .book-authors {
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .author-link {
    cursor: pointer;
    transition: var(--transition);
  }
  
  .author-link:hover {
    color: var(--accent);
  }
  
  .author-separator {
    margin: 0 2px;
  }
  
  @media (max-width: 480px) {
    .book-info {
      padding: 8px;
    }
    
    .book-title {
      font-size: 13px;
    }
    
    .book-authors {
      font-size: 11px;
    }
  }
</style>