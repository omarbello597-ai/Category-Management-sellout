// Service Worker · Category Management PWA
// Cambia CACHE cuando quieras invalidar todo lo guardado en los dispositivos.
const CACHE = 'catmgmt-v4';
const CORE = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable.png'];

// Instala: cachea los archivos base uno por uno (si alguno falta, no bloquea la instalación)
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(CORE.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

// Activa: borra caches viejos y toma control de las pestañas abiertas de inmediato
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

// Red primero SIN caché HTTP (siempre trae la versión publicada); el cache solo se usa sin conexión.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const sameOrigin = new URL(req.url).origin === self.location.origin;
  if (!sameOrigin) return; // librerías externas (CDN): que las maneje el navegador
  e.respondWith(
    fetch(req, { cache: 'no-store' })
      .then((resp) => {
        if (resp && resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return resp;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./index.html')))
  );
});
