const CACHE_NAME = "systems-garden-v5";
const GARDEN_SHELL = "/game/index.html";
const STATIC_SHELL = ["/favicon.svg", "/assets/generated/voxel-garden-key-art.jpg"];

const localPath = (value, base = self.location.origin) => {
  const url = new URL(value, base);
  return url.origin === self.location.origin ? `${url.pathname}${url.search}` : null;
};

const referencedPaths = (source, base) => {
  const paths = [];
  const patterns = [/(?:src|href)=["']([^"']+)["']/g, /url\(["']?([^"')]+)["']?\)/g];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const path = localPath(match[1], base);
      if (path && !path.startsWith("/data:")) paths.push(path);
    }
  }

  return paths;
};

async function precacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  const indexResponse = await fetch(GARDEN_SHELL, { cache: "reload" });
  if (!indexResponse.ok) throw new Error("Unable to fetch the application shell.");

  const html = await indexResponse.clone().text();
  await Promise.all([
    cache.put("/game", indexResponse.clone()),
    cache.put(GARDEN_SHELL, indexResponse.clone()),
  ]);

  const firstPass = [...new Set([...STATIC_SHELL, ...referencedPaths(html, self.location.origin)])];
  await cache.addAll(firstPass);

  const cssPaths = firstPass.filter((path) => path.endsWith(".css"));
  const nestedAssets = [];
  for (const path of cssPaths) {
    const response = await cache.match(path);
    if (!response) continue;
    nestedAssets.push(...referencedPaths(await response.text(), new URL(path, self.location.origin).href));
  }

  const secondPass = [...new Set(nestedAssets)].filter((path) => !firstPass.includes(path));
  if (secondPass.length > 0) await cache.addAll(secondPass);
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheAppShell());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const cacheKey = `${url.pathname}${url.search}`;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(GARDEN_SHELL))
    );
    return;
  }

  event.respondWith(
    caches.match(cacheKey).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(cacheKey, copy));
        }
        return response;
      });
    })
  );
});
