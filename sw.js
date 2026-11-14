const CACHE_NAME = 'bac-alqadr-cache-v1';
const urlsToCache = [
  '/Quiz_Bac/',
  '/Quiz_Bac/index.html',
  '/Quiz_Bac/style.css',
  '/Quiz_Bac/app.js'
];

// تثبيت الـ Service Worker وحفظ الملفات في الذاكرة المؤقتة
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// جلب الملفات من الكاش لتشغيل التطبيق بسلاسة
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
