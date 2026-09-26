// FlowPay 서비스 워커
// - 페이지 이동(HTML): 네트워크 우선, 오프라인이면 캐시된 앱 셸로 대체
// - 정적 자산(/static/*, 이미지 등): 캐시 우선, 없으면 받아서 저장
// 빌드 파일명에 해시가 붙으므로 설치 시에는 앱 셸만 미리 캐시합니다.
const CACHE_NAME = 'flowpay-v2';
const APP_SHELL = ['/', '/manifest.json', '/LOGO.png', '/favicon.ico'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  // 외부 요청(OCR 학습 데이터 CDN 등)과 GET 이외 요청은 관여하지 않음
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/', copy));
          return response;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok && (url.pathname.startsWith('/static/') || /\.(png|ico|svg|json)$/.test(url.pathname))) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
    )
  );
});
