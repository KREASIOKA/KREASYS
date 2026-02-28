const CACHE_NAME = 'kreasys-v2';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/core/state.js',
    '/js/core/vfs.js',
    '/js/core/ai.js',
    '/js/core/telegram.js',
    '/js/ui/app.js',
    '/manifest.json'
];

// Install: pre-cache all static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: serve from cache first, fall back to network
self.addEventListener('fetch', event => {
    // Skip non-GET and cross-origin API requests (LLM, Telegram)
    if (event.request.method !== 'GET') return;
    if (event.request.url.includes('api.telegram.org')) return;
    if (event.request.url.includes('openrouter.ai') || event.request.url.includes('groq.com') || event.request.url.includes('nvidia.com')) return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(resp => {
                // Cache successful same-origin responses
                if (resp && resp.status === 200 && resp.type === 'basic') {
                    const cloned = resp.clone();
                    caches.open(CACHE_NAME).then(c => c.put(event.request, cloned));
                }
                return resp;
            }).catch(() => cached);
        })
    );
});
