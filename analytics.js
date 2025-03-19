(function() {
    const GA_ID = 'G-0B29XWKYNY'; // Google Analytics ID
    
    // 初始化GA
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    window.gtag = gtag; // 导出gtag函数，方便在其他地方调用
    
    // 确保在客户端环境下执行
    if (typeof window !== 'undefined') {
        gtag('js', new Date());
        gtag('config', GA_ID);
    }
})();