<script>
  import { createEventDispatcher } from 'svelte'
  import { setPassword } from '../stores/auth.js'
  
  const dispatch = createEventDispatcher()
  
  let passwordInput = ''
  let statusMessage = ''
  let statusType = ''
  
  function handleClose() {
    dispatch('close')
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
  
  function handleSubmitPassword() {
    if (!passwordInput.trim()) {
      statusMessage = '请输入访问码'
      statusType = 'error'
      return
    }
    
    setPassword(passwordInput.trim())
    statusMessage = '访问码已保存 √'
    statusType = 'success'
    passwordInput = ''
    
    setTimeout(() => {
      statusMessage = ''
      statusType = ''
    }, 2000)
  }
  
  function handleKeyPress(event) {
    if (event.key === 'Enter') {
      handleSubmitPassword()
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="modal-overlay" on:click={handleOverlayClick}>
  <div class="modal-container">
    <div class="modal-header">
      <div class="modal-title">FROM RAINDROP213</div>
      <div class="modal-actions">
        <button class="modal-action-button close-button" on:click={handleClose} title="关闭">
          <i class="bi bi-x"></i>
        </button>
      </div>
    </div>
    
    <div class="about-content">
      <div class="about-text">
        <h2>欢迎使用 RAINDROP213 书库项目</h2>
        <p>
          本项目唯一站点为 <a href="http://ebook.raindrop213.com" target="_blank">ebook.raindrop213.com</a> 
          此外的站点均为盗链。然后旧站点将继续保持推送，有需要的可以通过 
          <a href="http://calibre.raindrop213.com" target="_blank">calibre.raindrop213.com</a> 访问。
          最后本站仅作为学习使用，不提供任何商业用途，感谢使用！
        </p>
        
        <ul>
          <li>
            使用了 <a href="https://github.com/satorumurmur/bibi" target="_blank">BiBi</a> 
            作为阅读器，一个非常棒的EPUB阅读器，感谢该项目作者的贡献
          </li>
          <li>
            对比 <a href="https://github.com/janeczku/calibre-web" target="_blank">calibre-web</a> 
            搭建的旧站在移动端灾难级的表现，现在这个明显要好得多
          </li>
          <li>
            WEB阅读器 <a href="https://reader.ttsu.app" target="_blank">ッツ</a> 
            和 <a href="/bibi/?book=" target="_blank">BiBi</a> 可以读取本地的EPUB电子书
          </li>
          <li>界面设计来源于calibre-web中的黑暗模式</li>
        </ul>
      </div>
      
      <div class="password-section">
        <h3>访问控制</h3>
        <div class="password-input-group">
          <input 
            type="password" 
            bind:value={passwordInput}
            on:keypress={handleKeyPress}
            placeholder="输入访问码可开放更多书籍..." 
            class="password-input"
          />
          <button class="btn" on:click={handleSubmitPassword}>保存</button>
        </div>
        
        {#if statusMessage}
          <div class="password-status {statusType}">
            {statusMessage}
          </div>
        {/if}
      </div>
      
      <div class="update-info">
        <p class="update-date">update: 2025.03.18</p>
        <p class="tech-info">使用 Svelte 重构前端界面</p>
      </div>
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
    max-width: 600px;
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
  
  .about-content {
    max-height: calc(90vh - 100px);
    overflow-y: auto;
    padding: 24px;
  }
  
  .about-text {
    margin-bottom: 32px;
  }
  
  .about-text h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 16px 0;
  }
  
  .about-text p {
    color: var(--text-secondary);
    line-height: 1.6;
    margin: 0 0 16px 0;
  }
  
  .about-text ul {
    color: var(--text-secondary);
    line-height: 1.6;
    margin: 0;
    padding-left: 20px;
  }
  
  .about-text li {
    margin-bottom: 8px;
  }
  
  .about-text a {
    color: var(--accent);
    text-decoration: none;
    transition: var(--transition);
  }
  
  .about-text a:hover {
    color: var(--accent-hover);
    text-decoration: underline;
  }
  
  .password-section {
    background: var(--bg-tertiary);
    padding: 20px;
    border-radius: var(--radius);
    margin-bottom: 24px;
  }
  
  .password-section h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 16px 0;
  }
  
  .password-input-group {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .password-input {
    flex: 1;
    padding: 8px 12px;
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--text-primary);
    font-size: 14px;
    transition: var(--transition);
  }
  
  .password-input:focus {
    outline: none;
    border-color: var(--accent);
  }
  
  .password-input::placeholder {
    color: var(--text-muted);
  }
  
  .password-status {
    padding: 8px 12px;
    border-radius: var(--radius);
    font-size: 14px;
    text-align: center;
    transition: var(--transition);
  }
  
  .password-status.success {
    background: rgba(76, 175, 80, 0.2);
    color: var(--success);
  }
  
  .password-status.error {
    background: rgba(244, 67, 54, 0.2);
    color: var(--error);
  }
  
  .update-info {
    text-align: center;
    color: var(--text-muted);
    font-size: 12px;
    border-top: 1px solid var(--border);
    padding-top: 16px;
  }
  
  .update-info p {
    margin: 0 0 4px 0;
  }
  
  .update-date {
    font-weight: 600;
  }
  
  .tech-info {
    font-style: italic;
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
    
    .modal-action-button {
      width: 36px;
      height: 36px;
    }
    
    .about-content {
      padding: 16px;
    }
    
    .about-text h2 {
      font-size: 18px;
    }
    
    .password-section {
      padding: 16px;
    }
    
    .password-input-group {
      flex-direction: column;
    }
  }
</style>