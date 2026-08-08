const CACHE_NAME = "tt-timer-cache-v4";
const CORE_ASSETS = ["./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];
// Best-effort precache of CDN dependencies so the app still boots offline after
// a first successful load. Each one is added individually and failures are
// swallowed — a slow/unreachable CDN asset must never block install.
// Opaque (no-cors) is fine for classic <script src> tags (tailwind, chart.js, peerjs).
const RUNTIME_ASSETS_OPAQUE = [
  "https://cdn.tailwindcss.com",
  "https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js",
  "https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js",
];
// These are loaded via ES module `import()`, which requires a real (non-opaque)
// CORS response to be usable — so we fetch them normally instead of no-cors.
// cubing.js also pulls in further chained sub-resources (workers/wasm/data) at
// runtime that can't be known ahead of time; those get picked up by the
// generic fetch handler below the first time they're successfully requested,
// so the app becomes more fully offline-capable the more it's used online.
const RUNTIME_ASSETS_CORS = [
  "https://cdn.cubing.net/v0/js/cubing/scramble",
  "https://cdn.cubing.net/v0/js/scramble-display",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(CORE_ASSETS).catch(() => {});
      await Promise.all([
        ...RUNTIME_ASSETS_OPAQUE.map((url) =>
          cache.add(new Request(url, { mode: "no-cors" })).catch(() => {})
        ),
        ...RUNTIME_ASSETS_CORS.map((url) =>
          fetch(url)
            .then((res) => (res.ok ? cache.put(url, res) : null))
            .catch(() => {})
        ),
      ]);
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
      // Let open tabs know a new version is active so the UI can offer a refresh.
      const clientsList = await self.clients.matchAll({ type: "window" });
      clientsList.forEach((c) => c.postMessage({ type: "tt-sw-updated" }));
    })()
  );
});

// Network-first for navigation/HTML so updates show up quickly; fall back to
// cache when offline. Cache-first for everything else (fonts, cdn scripts,
// scramble engine, chart library) since those are versioned/immutable enough
// that staleness isn't a real concern and speed/offline-availability matters more.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && (res.ok || res.type === "opaque")) {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});
