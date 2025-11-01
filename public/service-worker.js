const CACHE_NAME = "wai-pwa-v1";
const STATIC_CACHE = "wai-static-v1";
const DYNAMIC_CACHE = "wai-dynamic-v1";

// 정적 리소스 캐싱
const staticAssets = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-72.png",
  "/icons/icon-96.png",
  "/icons/icon-128.png",
  "/icons/icon-144.png",
  "/icons/icon-152.png",
  "/icons/icon-192.png",
  "/icons/icon-384.png",
  "/icons/icon-512.png"
];

// 설치 이벤트 - 정적 리소스 캐싱
self.addEventListener("install", event => {
  console.log("[Service Worker] Installing...");
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log("[Service Worker] Caching static assets");
      return cache.addAll(staticAssets);
    })
  );
  self.skipWaiting();
});

// 활성화 이벤트 - 오래된 캐시 삭제
self.addEventListener("activate", event => {
  console.log("[Service Worker] Activating...");
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 페치 이벤트 - 캐시 우선, 네트워크 폴백 전략
self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);

  // 정적 리소스는 캐시 우선
  if (staticAssets.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        return cachedResponse || fetch(request);
      })
    );
    return;
  }

  // 외부 리소스는 네트워크 우선, 캐시 폴백
  event.respondWith(
    fetch(request)
      .then(response => {
        // 응답을 복제하여 캐시에 저장
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE).then(cache => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // 네트워크 실패 시 캐시에서 반환
        return caches.match(request);
      })
  );
});
