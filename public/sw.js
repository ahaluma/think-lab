// Service worker: AnkaPlay works without a connection after the first visit.
// It only keeps copies of this site's own files on the device. Nothing is sent anywhere.
//
// Network first: with a connection the newest file is used and its copy is refreshed, so an update
// goes live as before. Without a connection the copy is used. Registered by welt/map.js.

const CACHE = "ankaplay-v2";

// The files of the new world, fetched once when the worker is installed, so a round works offline
// even if the child has only seen the map. Everything else is copied when it is first used.
const WORLD = [
  "/welt/", "/welt/welt.css", "/welt/map.js", "/welt/spiel/", "/welt/spiel/spiel.js",
  "/welt/frame/ideas.js", "/welt/frame/record.js", "/welt/frame/voice.js",
  "/welt/frame/parts.js", "/welt/ideas/teile/tasks.js", "/welt/ideas/teile/boards.js",
  "/welt/ideas/zahl/tasks.js", "/welt/ideas/zahl/boards.js",
  "/welt/lang/de.js", "/welt/lang/en.js", "/welt/lang/ne.js",
  "/shared/base.css", "/shared/kit.js", "/shared/i18n.js", "/shared/store.js", "/shared/profiles.js",
  "/shared/things.js", "/shared/gen.js", "/shared/lang/de.js", "/shared/lang/en.js", "/shared/lang/ne.js",
  "/favicon.svg?v=3",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => Promise.all(WORLD.map((url) => cache.add(url).catch(() => {})))).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== location.origin) return;
  event.respondWith(
    // "no-cache": always ask the server whether the file changed, so an update shows at once and a
    // phone never keeps playing an old version from the browser's own cache.
    fetch(request.url, { cache: "no-cache" })
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => (await caches.match(request)) || (await caches.match(request, { ignoreSearch: true })) || Response.error()),
  );
});
