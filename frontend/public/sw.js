// Minimal service worker (Stage 1): exists so the browser offers installation.
// It does not cache anything yet -- Stage 2 replaces it with a Serwist worker.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// A fetch handler is required for the install prompt; requests fall through to
// the network untouched (no caching yet).
self.addEventListener("fetch", () => {});
