// Google Analytics 配置
const GA_ID = 'G-0B29XWKYNY';

// 加载 Google Analytics 脚本
const script = document.createElement('script');
script.async = true;
script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
document.head.appendChild(script);

// Google tag (gtag.js)
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', GA_ID);