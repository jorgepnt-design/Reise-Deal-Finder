const CACHE_NAME = "reise-deal-finder-v1";
const BASE_PATH = "/Reise-Deal-Finder/";
const STATIC_ASSETS = [
  BASE_PATH,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}offline.html`,
  `${BASE_PATH}manifest.json`,
  `${BASE_PATH}icons/apple-touch-icon.png`,
  `${BASE_PATH}icons/icon-192.png`,
  `${BASE_PATH}icons/icon-512.png`,
  `${BASE_PATH}icons/icon-1024.png`,
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match(`${BASE_PATH}offline.html`)));
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(`${BASE_PATH}offline.html`));
    }),
  );
});

self.addEventListener("push", (event) => {
  const data = event.data?.json?.() ?? {
    title: "Neuer Reise-Deal",
    body: "Ein beobachteter Preis ist gefallen.",
    url: BASE_PATH,
  };

  event.waitUntil(
    self.registration.showNotification(data.title ?? "Neuer Reise-Deal", {
      body: data.body ?? "Ein beobachteter Preis ist gefallen.",
      icon: `${BASE_PATH}icons/icon-192.png`,
      badge: `${BASE_PATH}icons/icon-192.png`,
      data: { url: data.url ?? BASE_PATH },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? BASE_PATH;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existingClient = clients.find((client) => client.url.includes(BASE_PATH));
      if (existingClient) return existingClient.focus();
      return self.clients.openWindow(targetUrl);
    }),
  );
});
