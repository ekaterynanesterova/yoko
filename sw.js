/* Офлайн-режим: на кухне вайфай может пропасть, страница должна открываться всё равно. */
const CACHE = "yoko-v5";
const SHELL = [
  "./", "./index.html", "./styles.css",
  "./data.js", "./photos.js", "./scan.js", "./order.js",
  "./progress.js", "./sync.js", "./app.js",
  "./icon.svg", "./icon-180.png", "./icon-192.png", "./icon-512.png",
  "./manifest.webmanifest"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  /* Supabase — всегда в сеть, ответы не кэшируем. */
  if (url.hostname.endsWith("supabase.co")) return;

  /* Шрифты Google — из кэша, иначе тянем и кладём. */
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => hit))
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  /* Картинки не меняются — из кэша сразу, а чего нет, докладываем при первом показе. */
  if (/\.(png|svg|ico|jpe?g|webp)$/i.test(url.pathname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    })));
    return;
  }

  /* Остальное: сначала сеть, кэш — запасной вариант.
     Иначе после деплоя телефон продолжает показывать старую версию. */
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
  );
});
