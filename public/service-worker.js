/* service-worker.js
   Nutriporc - SW con caching correcto para evitar duplicados en reconexión
   - Cachea sólo GET de assets estáticos.
   - Nunca cachea /api ni POST/PUT/DELETE.
   - Navegaciones (HTML): network-first con fallback a /index.html.
   - Assets: stale-while-revalidate (rápido + se actualiza en segundo plano).
*/

const CACHE_NAME = "Nutriporc-cache-v4";

// Archivos base mínimos para que la app arranque offline
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",

];

// Rutas que JAMÁS se cachean (APIs, endpoints dinámicos)
const NEVER_CACHE_PREFIXES = ["/api"];

// ========== INSTALL ==========
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn("No se pudieron cachear todos los assets base:", err);
      })
    )
  );
  self.skipWaiting();
});

// ========== ACTIVATE ==========
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// ========== FETCH ==========
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // 1) Navegaciones (HTML): network-first, fallback a index
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // 2) Solo GET es cacheable (evita cachear POST/PUT/DELETE que causan duplicados)
  if (req.method !== "GET") {
    event.respondWith(fetch(req));
    return;
  }

  const url = new URL(req.url);

  // Sólo cacheamos recursos del mismo origen (evita problemas con CDNs externos si no querés)
  const sameOrigin = url.origin === self.location.origin;

  // 3) Nunca cachear APIs/JSON dinámico
  if (sameOrigin && NEVER_CACHE_PREFIXES.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(
      fetch(req).catch(() =>
        new Response(JSON.stringify({ ok: false, offline: true }), {
          headers: { "Content-Type": "application/json" },
          status: 503,
        })
      )
    );
    return;
  }

  // 4) Assets GET: stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          // Cacheamos sólo respuestas 200 y de mismo origen (type "basic")
          if (
            sameOrigin &&
            networkRes &&
            networkRes.status === 200 &&
            networkRes.type === "basic"
          ) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(() => cached); // sin red → usa cache si existe

      // devuelve rápido desde caché si está; si no, red
      return cached || fetchPromise;
    })
  );
});

// ========== (Opcional) Mensajes del cliente para hacer skipWaiting manual ==========
self.addEventListener("message", (event) => {
  if (event.data === "SW_SKIP_WAITING") {
    self.skipWaiting();
  }
});

/* ================= TIPS DE USO =================
1) Forzar actualización del SW:
   - Cambiá CACHE_NAME a "mandaditos-cache-v7" cuando cambies recursos estáticos.
   - O desde la web: navigator.serviceWorker.controller.postMessage("SW_SKIP_WAITING")

2) Registro en tu app (ej. main.ts/main.jsx):
   if ("serviceWorker" in navigator) {
     window.addEventListener("load", () => {
       navigator.serviceWorker.register("/service-worker.js").then((reg) => {
         // opcional: escuchar updates
         if (reg.waiting) {
           // hay una versión nueva esperando; decidí si recargar
         }
       }).catch(console.error);
     });
   }

3) Verificación rápida:
   - En DevTools → Application → Service Workers → "Update" para actualizar.
   - En Network, verificá que llamadas a /api NO digan "from ServiceWorker".
   - Probar: offline → crear algo → online → NO debe duplicarse.
*/
