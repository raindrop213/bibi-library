<script>
  import { showFullscreenCover, fullscreenCoverUrl, hideCover } from '../stores/ui.js'
  
  function handleClose() {
    hideCover()
  }
  
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      handleClose()
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if $showFullscreenCover}
  <div class="fullscreen-cover-overlay" on:click={handleClose}>
    <div class="fullscreen-cover-container">
      <img 
        src={$fullscreenCoverUrl} 
        alt="Book Cover" 
        class="fullscreen-cover-img"
      />
      <button class="close-button" on:click={handleClose}>
        <i class="bi bi-x"></i>
      </button>
    </div>
  </div>
{/if}

<style>
  .fullscreen-cover-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1001;
    padding: 20px;
  }
  
  .fullscreen-cover-container {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .fullscreen-cover-img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: var(--radius);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }
  
  .close-button {
    position: absolute;
    top: -10px;
    right: -10px;
    width: 40px;
    height: 40px;
    background: var(--bg-secondary);
    border: none;
    border-radius: 50%;
    color: var(--text-primary);
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--transition);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  .close-button:hover {
    background: var(--bg-tertiary);
    transform: scale(1.1);
  }
  
  @media (max-width: 768px) {
    .fullscreen-cover-overlay {
      padding: 10px;
    }
    
    .fullscreen-cover-container {
      max-width: 95vw;
      max-height: 95vh;
    }
    
    .close-button {
      top: 10px;
      right: 10px;
      width: 36px;
      height: 36px;
      font-size: 16px;
    }
  }
</style>