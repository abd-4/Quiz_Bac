const CACHE_NAME = 'bac-alqadr-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js'
];

// تثبيت الـ Service Worker وحفظ الملفات الأساسية مؤقتاً
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// جلب الملفات من الذاكرة المؤقتة لضمان عمل التطبيق بسلاسة
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
