const CACHE_NAME = 'arbtr-v1';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './images/logo192.png',
    './images/logo512.png'
];

// Install Event
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

// Fetch Event (Offline Capability)
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});