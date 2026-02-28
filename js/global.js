// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(reg => {
            console.log('[KREASYS] Service Worker registered:', reg.scope);
        }).catch(e => console.warn('[KREASYS] SW registration failed:', e));
    });
}
