// Кэширует приложение, чтобы оно работало без интернета.
// При изменении файлов поднимайте версию, чтобы планшет скачал обновление.
const VERSION = 'uchimsya-v3';
const SHELL = [
  './', 'index.html', 'styles.css', 'manifest.webmanifest',
  'js/data.js', 'js/voice.js', 'js/app.js', 'audio/index.json',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then(async (c) => {
    await c.addAll(SHELL);
    // записанный голос тоже кладём в кэш, чтобы он работал без интернета
    const keys = await fetch('audio/index.json').then(r => r.json()).catch(() => []);
    await c.addAll(keys.map(k => 'audio/' + k + '.mp3')).catch(() => {});
  }).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      // Шрифты Google и свои файлы складываем в кэш при первом открытии.
      const url = new URL(e.request.url);
      if (res.ok && (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname))) {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('index.html')))
  );
});
