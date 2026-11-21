// Service worker da Caminho Calçados. Mude VERSION para forçar a atualização do cache.
const VERSION = "caminho-v12";
const SHELL = `${VERSION}-shell`;
const PAGES = `${VERSION}-pages`;
const IMGS = `${VERSION}-img`;
const DATA = `${VERSION}-data`;
// Só leitura do catálogo pode ser reaproveitada offline
const CATALOGO = /^\/api\/(config|home|depoimentos|produtos(\/.*)?)$/;
const SHELL_FILES = [
  "/",
  "/offline.html",
  "/manifest.json",
  "/CSS/style.css",
  "/JS/script.js",
  "/JS/lib.js",
  "/JS/carousel.js",
  "/JS/views-shop.js",
  "/JS/views-account.js",
  "/JS/views-admin.js",
  "/JS/pwa.js",
  "/Assets/logo-mark.png",
  "/Assets/logo-text.png",
  "/Assets/hero.jpg",
  "/Assets/sobre-nos.jpg",
  "/Assets/icons/icon-192.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(SHELL)
      .then((c) => Promise.allSettled(SHELL_FILES.map((f) => c.add(f)))),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(VERSION))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (e) => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});

async function trim(name, max) {
  const c = await caches.open(name);
  const keys = await c.keys();
  if (keys.length > max)
    await Promise.all(keys.slice(0, keys.length - max).map((k) => c.delete(k)));
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // fontes, mapas, ViaCEP: direto na rede
  // Catálogo: rede primeiro; sem internet, mostra a última resposta guardada
  if (CATALOGO.test(url.pathname)) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(DATA).then((c) => c.put(req, copy));
            trim(DATA, 60);
          }
          return res;
        })
        .catch(async () => (await caches.match(req)) || Response.error()),
    );
    return;
  }
  // Pedidos, conta, sessão e painel: sempre rede
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin"))
    return;

  // Navegação: rede primeiro, cai para a casca do app (SPA) ou a página offline
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(PAGES).then((c) => c.put("/", copy));
          return res;
        })
        .catch(
          async () =>
            (await caches.match("/")) || caches.match("/offline.html"),
        ),
    );
    return;
  }

  // Imagens (produtos e uploads): cache primeiro, atualiza em segundo plano
  if (
    /\.(png|jpe?g|webp|svg|ico)$/i.test(url.pathname) ||
    url.pathname.startsWith("/uploads/")
  ) {
    e.respondWith(
      caches.open(IMGS).then(async (c) => {
        const hit = await c.match(req);
        const net = fetch(req)
          .then((res) => {
            if (res.ok) {
              c.put(req, res.clone());
              trim(IMGS, 80);
            }
            return res;
          })
          .catch(() => hit);
        return hit || net;
      }),
    );
    return;
  }

  // CSS/JS/manifest: stale-while-revalidate
  e.respondWith(
    caches.open(SHELL).then(async (c) => {
      const hit = await c.match(req);
      const net = fetch(req)
        .then((res) => {
          if (res.ok) c.put(req, res.clone());
          return res;
        })
        .catch(() => hit);
      return hit || net;
    }),
  );
});
