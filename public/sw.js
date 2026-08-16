/* ---------------------------------------------------------------------------
 * Nisos service worker.
 *
 * Scope: make the installed app open instantly and survive a dropped signal
 * on a real phone. It does NOT enable background push — that needs a server
 * to hold subscriptions and a VAPID key, neither of which exists in this
 * prototype (see docs/INTEGRATIONS.md). Notifications only fire while a tab
 * is open; see src/lib/notify.ts.
 *
 * Bump CACHE_VERSION on every deploy that should invalidate old caches.
 * ------------------------------------------------------------------------- */

const CACHE_VERSION = 'nisos-v2';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const SHELL_URLS = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // App navigations: try the network first (so a new deploy is picked up
  // immediately), fall back to the cached shell when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(SHELL_CACHE).then((cache) => cache.put('/', res.clone()));
          return res;
        })
        .catch(() => caches.match('/')),
    );
    return;
  }

  // Everything else same-origin (hashed JS/CSS/icons) and the two Google
  // Fonts origins: stale-while-revalidate, so a repeat visit is instant and
  // still refreshes quietly in the background.
  if (url.origin === self.location.origin || url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com')) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached ?? network;
      }),
    );
  }
});
