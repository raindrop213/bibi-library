(function() {
    const GA_ID = 'G-0B29XWKYNY'; // Google Analytics ID
    
    // 动态加载GA脚本
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    // 初始化GA
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    window.gtag = gtag; // 导出gtag函数，方便在其他地方调用
    gtag('js', new Date());
    gtag('config', GA_ID);
})();