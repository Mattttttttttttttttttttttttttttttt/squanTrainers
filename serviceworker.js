// serviceworker.js

const CACHE_NAME = 'squan-trainer-cache-v1.1.3';
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

// Install — pre‑cache and activate immediately
self.addEventListener('install', event => {
    self.skipWaiting(); // take control immediately
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
    );
});

// Activate — delete old caches + claim clients
self.addEventListener('activate', event => {
     event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.map(key => key !== CACHE_NAME && caches.delete(key)))
        )
    );
    clients.claim(); // control already-open pages
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', event => {
    event.respondWith(
       fetch(event.request)
            .then(response => {
                const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            return response;
          }).catch(() => caches.match(event.request))
    );
});