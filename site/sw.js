// The service worker: precache everything the page needs, by the content
// hashes pages.yml writes into precache.json, so the app loads, verifies and
// answers with the network off. Every file but index.html is immutable per
// deploy (the holo is content-addressed), so the cache is the source and the
// network is the fallback. index.html goes to the network first, so a new
// deploy is seen on the next visit; a new worker then tells the page once.
const MANIFEST = "./precache.json";
let cacheName = null;

async function manifest() {
  const response = await fetch(MANIFEST, { cache: "no-store" });
  if (!response.ok) throw new Error(`precache.json: HTTP ${response.status}`);
  return response.json();
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const list = await manifest();
    cacheName = `prism-${list.version}`;
    const cache = await caches.open(cacheName);
    await cache.addAll(list.files.map((file) => new Request(file.path, { cache: "reload" })));
    await cache.put(MANIFEST, new Response(JSON.stringify(list), { headers: { "content-type": "application/json" } }));
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keep = cacheName ?? (await currentCacheName());
    for (const name of await caches.keys()) {
      if (name.startsWith("prism-") && name !== keep) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

async function currentCacheName() {
  const names = (await caches.keys()).filter((name) => name.startsWith("prism-"));
  return names[names.length - 1] ?? null;
}

self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  const isPage = event.request.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("/index.html");
  event.respondWith((async () => {
    const cache = await caches.open(cacheName ?? (await currentCacheName()) ?? "prism-none");
    if (isPage) {
      try {
        const fresh = await fetch(event.request);
        if (fresh.ok) await cache.put("./", fresh.clone());
        return fresh;
      } catch {
        return (await cache.match("./")) ?? (await cache.match(event.request)) ?? Response.error();
      }
    }
    const hit = await cache.match(event.request, { ignoreSearch: true });
    if (hit) return hit;
    const fresh = await fetch(event.request);
    if (fresh.ok) await cache.put(event.request, fresh.clone());
    return fresh;
  })());
});
