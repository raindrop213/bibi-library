// Google Analytics 配置
const GA_ID = 'G-0B29XWKYNY';

// 确保在 DOM 完全加载后再初始化 GA
document.addEventListener('DOMContentLoaded', function() {
  // 加载 Google Analytics 脚本
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  
  script.onload = function() {
    // 初始化 gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;  // 将 gtag 设为全局函数
    
    gtag('js', new Date());
    gtag('config', GA_ID);
  };
  
  document.head.appendChild(script);
});