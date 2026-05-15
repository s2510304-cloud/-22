const CACHE = 'econation-v1';

self.addEventListener('install', e => {
  // 새 SW 설치 즉시 활성화 (기존 SW 대기 없이 바로 교체)
  e.waitUntil(
    fetch('/?_sw=' + Date.now(), { cache: 'no-store' })
      .then(r => caches.open(CACHE).then(c => c.put('/', r)))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      // 업데이트 감지 → 열려있는 모든 탭에 알림
      .then(() => self.clients.matchAll({ includeUncontrolled: true, type: 'window' }))
      .then(clients => clients.forEach(c => c.postMessage({ type: 'UPDATE' })))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') {
    // 항상 네트워크에서 최신 파일 가져옴, 오프라인 시 캐시 폴백
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then(r => {
          caches.open(CACHE).then(c => c.put(e.request, r.clone()));
          return r;
        })
        .catch(() => caches.match(e.request))
    );
  }
});
