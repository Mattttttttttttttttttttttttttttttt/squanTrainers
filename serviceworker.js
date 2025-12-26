// serviceworker.js

const CACHE_NAME = 'squan-trainer-cache-v1.1.4';
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.webmanifest',
    '/404.html',
    '/caticon.ico',
    '/caticonbig.png',
    '/caticonsmall.png',
    '/serviceworker.js',
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
    '/PBLTrainer/generators.json',
    '/PBLTrainer/favicon.ico',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css'
];


// Install event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching files');
                return cache.addAll(FILES_TO_CACHE);
            })
    );
});


// Activate event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});


// Fetch event
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response from cache
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});