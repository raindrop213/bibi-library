<script>
  import { onMount } from 'svelte'
  import { currentRoute } from './stores/router.js'
  import Sidebar from './components/Sidebar.svelte'
  import Header from './components/Header.svelte'
  import Books from './routes/Books.svelte'
  import Categories from './routes/Categories.svelte'
  import Authors from './routes/Authors.svelte'
  import Publishers from './routes/Publishers.svelte'
  import Series from './routes/Series.svelte'
  import Languages from './routes/Languages.svelte'
  import Favorites from './routes/Favorites.svelte'
  import CategoryBooks from './routes/CategoryBooks.svelte'
  import BookDetail from './components/BookDetail.svelte'
  import AboutModal from './components/AboutModal.svelte'
  import FullscreenCover from './components/FullscreenCover.svelte'

  let showAboutModal = false
  let showBookDetail = false
  let selectedBookId = null

  onMount(() => {
    // 初始化路由
    const hash = window.location.hash.slice(1) || 'books'
    currentRoute.set(hash)
    
    // 监听路由变化
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.slice(1) || 'books'
      currentRoute.set(hash)
    })
  })

  function handleBookSelect(event) {
    selectedBookId = event.detail.bookId
    showBookDetail = true
  }

  function handleCloseBookDetail() {
    showBookDetail = false
    selectedBookId = null
  }

  function handleShowAbout() {
    showAboutModal = true
  }

  function handleCloseAbout() {
    showAboutModal = false
  }
</script>

<div class="app">
  <Sidebar />
  
  <div class="main-content">
    <Header on:showAbout={handleShowAbout} />
    
    <div class="content">
      {#if $currentRoute === 'books'}
        <Books on:bookSelect={handleBookSelect} />
      {:else if $currentRoute === 'categories'}
        <Categories />
      {:else if $currentRoute === 'authors'}
        <Authors />
      {:else if $currentRoute === 'publishers'}
        <Publishers />
      {:else if $currentRoute === 'series'}
        <Series />
      {:else if $currentRoute === 'languages'}
        <Languages />
      {:else if $currentRoute === 'favorites'}
        <Favorites on:bookSelect={handleBookSelect} />
      {:else if $currentRoute.startsWith('categories/') || $currentRoute.startsWith('authors/') || $currentRoute.startsWith('publishers/') || $currentRoute.startsWith('series/') || $currentRoute.startsWith('languages/')}
        <CategoryBooks on:bookSelect={handleBookSelect} />
      {:else}
        <Books on:bookSelect={handleBookSelect} />
      {/if}
    </div>
  </div>

  {#if showBookDetail}
    <BookDetail bookId={selectedBookId} on:close={handleCloseBookDetail} />
  {/if}

  {#if showAboutModal}
    <AboutModal on:close={handleCloseAbout} />
  {/if}

  <FullscreenCover />
</div>

<style>
  .app {
    display: flex;
    height: 100vh;
    background: #1a1a1a;
    color: #e0e0e0;
  }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }
</style>