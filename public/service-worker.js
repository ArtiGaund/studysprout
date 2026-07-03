const CACHE_NAME = "studysprout-offline";
const OFFLINE_URL = "/offlinePage.html";

// Install: cache the offline page immediately
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache =>{
            return cache.addAll([
                OFFLINE_URL
            ]);
        })
    );
    // Activate immediately without waiting for old service worker to die
    self.skipWaiting();
});

// Activate: take control of all open tabs immediately
self.addEventListener("activate", event => {
    event.waitUntil(
        // Clean up old caches if you bump CACHE_NAME
        caches.keys().then(keys => 
            Promise.all(
                keys
                    .filter( k => k !== CACHE_NAME)
                    .map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

// Fetch: intercept navigation requests only
self.addEventListener('fetch', event => {
    // Only handle page navigation (not API calls, image, fonts, etc)
    if(event.request.mode !== 'navigate') return;

    event.respondWith(
        fetch(event.request)
            .catch(() => 
                // Network failed -> server the cached offline page
                caches.open(CACHE_NAME).then(cache =>
                    cache.match(OFFLINE_URL)
                )
            )
    );
});