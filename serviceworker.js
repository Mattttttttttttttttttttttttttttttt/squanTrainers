// serviceworker.js

// hi matt you run this:
// git submodule update --remote --merge
const CACHE_NAME = 'squan-trainer-cache-v1.2.2';

// Critical files - must cache successfully
const CRITICAL_FILES = [
    '/',
    '/index.html',
    '/manifest.webmanifest',
    '/caticon.ico',
    '/caticonbig.png',
    '/caticonsmall.png',
    '/OBLTrainer/index.html',
    '/OBLTrainer/index.css',
    '/OBLTrainer/cube.js',
    '/OBLTrainer/memo_generator.js',
    '/OBLTrainer/defaultlists.json',
    '/OBLTrainer/caticon.ico',
    '/PBLTrainer/index.html',
    '/PBLTrainer/index.css',
    '/PBLTrainer/cube.js',
    '/PBLTrainer/scrambler.js',
    '/PBLTrainer/defaultlists.json',
    '/PBLTrainer/favicon.ico'
];

// Optional files - won't break installation if they fail
const OPTIONAL_FILES = [
    '/404.html'
];

// External resources to cache separately (can fail without breaking install)
const EXTERNAL_RESOURCES = [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css'
];


// Install event - skip waiting to activate immediately
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installing new version:', CACHE_NAME);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async (cache) => {
                console.log('[ServiceWorker] Caching critical files');
                
                // Cache critical files one by one
                for (const file of CRITICAL_FILES) {
                    try {
                        console.log('[ServiceWorker] Caching:', file);
                        await cache.add(file);
                        console.log('[ServiceWorker] ✓ Cached:', file);
                    } catch (error) {
                        console.error('[ServiceWorker] ✗ Failed to cache critical file:', file, error);
                        throw error; // Stop installation if critical file fails
                    }
                }
                
                // Cache optional files (non-critical)
                for (const file of OPTIONAL_FILES) {
                    try {
                        console.log('[ServiceWorker] Caching optional:', file);
                        await cache.add(file);
                        console.log('[ServiceWorker] ✓ Cached optional:', file);
                    } catch (error) {
                        console.warn('[ServiceWorker] ✗ Failed to cache optional file (non-critical):', file, error);
                    }
                }
                
                // Cache external resources (non-critical)
                for (const url of EXTERNAL_RESOURCES) {
                    try {
                        console.log('[ServiceWorker] Caching external:', url);
                        await cache.add(url);
                        console.log('[ServiceWorker] ✓ Cached external:', url);
                    } catch (error) {
                        console.warn('[ServiceWorker] ✗ Failed to cache external (non-critical):', url, error);
                    }
                }
            })
            .then(() => {
                console.log('[ServiceWorker] All files cached successfully');
                // Force the waiting service worker to become the active service worker
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[ServiceWorker] Cache installation failed:', error);
                throw error;
            })
    );
});


// Activate event - claim clients immediately
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activating new version:', CACHE_NAME);
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[ServiceWorker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Take control of all pages immediately
            console.log('[ServiceWorker] Claiming clients');
            return self.clients.claim();
        })
    );
});


// Fetch event - network first for navigation, cache first for assets
self.addEventListener('fetch', (event) => {
    // Skip non-http(s) requests
    if (!event.request.url.startsWith('http')) {
        return;
    }
    
    console.log('[ServiceWorker] Fetch:', event.request.url, 'Mode:', event.request.mode);
    
    // For navigation requests, always go to network (don't intercept)
    if (event.request.mode === 'navigate') {
        console.log('[ServiceWorker] Navigation request, bypassing to network:', event.request.url);
        return; // Let the browser handle it normally
    }
    
    // For HTML documents (non-navigation), use stale-while-revalidate
    if (event.request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            (async () => {
                const cache = await caches.open(CACHE_NAME);
                let cachedResponse = await cache.match(event.request);
                
                // Fetch from network in background
                const fetchPromise = fetch(event.request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    })
                    .catch(() => cachedResponse);
                
                return cachedResponse || fetchPromise;
            })()
        );
    } else {
        // For other files (CSS, JS, images), use cache first
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    if (response) {
                        console.log('[ServiceWorker] Cache hit:', event.request.url);
                        return response;
                    }
                    console.log('[ServiceWorker] Cache miss, fetching:', event.request.url);
                    return fetch(event.request).then((response) => {
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                        return response;
                    });
                })
        );
    }
});


// Listen for messages from clients
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});