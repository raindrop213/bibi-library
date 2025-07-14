<script>
  import { createEventDispatcher } from 'svelte'
  import BookGrid from '../components/BookGrid.svelte'
  import { favoriteBooks } from '../stores/favorites.js'
  import { searchQuery } from '../stores/ui.js'
  
  const dispatch = createEventDispatcher()
  
  let filteredBooks = []
  
  // 响应式计算过滤后的收藏书籍
  $: {
    if ($searchQuery) {
      filteredBooks = $favoriteBooks.filter(book => 
        book.title.toLowerCase().includes($searchQuery.toLowerCase()) ||
        (book.author && book.author.some && book.author.some(author => 
          author.toLowerCase().includes($searchQuery.toLowerCase())
        )) ||
        (book.author && typeof book.author === 'string' && 
          book.author.toLowerCase().includes($searchQuery.toLowerCase())
        )
      )
    } else {
      filteredBooks = [...$favoriteBooks]
    }
    
    // 按添加时间倒序排列
    filteredBooks.sort((a, b) => {
      return new Date(b.date_added) - new Date(a.date_added)
    })
  }
  
  function handleBookSelect(event) {
    dispatch('bookSelect', event.detail)
  }
</script>

{#if $favoriteBooks.length === 0}
  <div class="empty-favorites">
    <i class="bi bi-bookmarks"></i>
    <h3>还没有收藏任何书籍</h3>
    <p>在书籍详情页点击收藏按钮来添加你喜欢的书籍</p>
  </div>
{:else}
  <BookGrid 
    books={filteredBooks} 
    hasMore={false}
    loading={false}
    on:bookSelect={handleBookSelect}
  />
{/if}

<style>
  .empty-favorites {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 60px 20px;
    color: var(--text-muted);
    text-align: center;
    height: 100%;
  }
  
  .empty-favorites i {
    font-size: 64px;
    opacity: 0.5;
  }
  
  .empty-favorites h3 {
    font-size: 20px;
    margin: 0;
    color: var(--text-secondary);
  }
  
  .empty-favorites p {
    font-size: 14px;
    margin: 0;
    max-width: 400px;
    line-height: 1.5;
  }
</style>