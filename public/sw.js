// Service worker: AnkaPlay works without a connection after the first visit.
// It only keeps copies of this site's own files on the device. Nothing is sent anywhere.
//
// Network first: with a connection the newest file is used and its copy is refreshed, so an update
// goes live as before. Without a connection the copy is used. Registered by welt/map.js.

const CACHE = "ankaplay-v12";

// The files of the new world, fetched once when the worker is installed, so a round works offline
// even if the child has only seen the map. Everything else is copied when it is first used.
const WORLD = [
  "/welt/", "/welt/welt.css", "/welt/map.js", "/welt/spiel/", "/welt/spiel/spiel.js",
  "/welt/frame/ideas.js", "/welt/frame/record.js", "/welt/frame/voice.js",
  "/welt/frame/parts.js", "/welt/ideas/teile/tasks.js", "/welt/ideas/teile/boards.js",
  "/welt/ideas/zahl/tasks.js", "/welt/ideas/zahl/boards.js",
  "/welt/ideas/muster/tasks.js", "/welt/ideas/muster/boards.js",
  "/welt/ideas/gruppen/tasks.js", "/welt/ideas/gruppen/boards.js",
  "/welt/berg/", "/welt/berg/berg.js", "/welt/berg/kit.js", "/welt/berg/camp.js", "/welt/berg/keepsake.js", "/welt/ideas/huetten/tasks.js", "/welt/ideas/huetten/boards.js", "/welt/ideas/vorrat/tasks.js", "/welt/ideas/vorrat/boards.js", "/welt/ideas/haken/tasks.js", "/welt/ideas/haken/boards.js", "/welt/ideas/zaun/tasks.js", "/welt/ideas/zaun/boards.js", "/welt/ideas/zaun/ways.js",
  "/welt/ideas/ameisen/tasks.js", "/welt/ideas/ameisen/boards.js", "/welt/ideas/waage/tasks.js", "/welt/ideas/waage/boards.js", "/welt/ideas/stall/tasks.js", "/welt/ideas/stall/boards.js", "/welt/ideas/tanz/tasks.js", "/welt/ideas/tanz/boards.js", "/welt/ideas/fels/tasks.js", "/welt/ideas/fels/boards.js", "/welt/ideas/socken/tasks.js", "/welt/ideas/socken/boards.js",
  "/catalog.js", "/games/zahlen-memory/", "/games/zahlen-memory/game.js", "/games/zahlen-memory/game.css",
  "/games/zahlen-memory/levels.js", "/games/zahlen-memory/tasks.js", "/shared/adapt.js", "/shared/progress.js", "/shared/fit.js",
  "/games/zahlen-memory/lang/de.js", "/games/zahlen-memory/lang/en.js", "/games/zahlen-memory/lang/ne.js",
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
