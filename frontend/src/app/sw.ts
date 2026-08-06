import { defaultCache } from "@serwist/next/worker";
import type {
  PrecacheEntry,
  RuntimeCaching,
  SerwistGlobalConfig,
} from "serwist";
import {
  CacheableResponsePlugin,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const runtimeCaching: RuntimeCaching[] = [
  // Public price/product data: serve fast from cache, refresh in the background.
  {
    matcher: ({ url, request, sameOrigin }) =>
      sameOrigin &&
      request.method === "GET" &&
      url.pathname.startsWith("/api/cijene/"),
    handler: new StaleWhileRevalidate({
      cacheName: "cijene-api",
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({
          maxEntries: 200,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        }),
      ],
    }),
  },
  // Authed data belongs to the React Query IndexedDB cache, never Cache Storage.
  {
    matcher: ({ url, sameOrigin }) =>
      sameOrigin && url.pathname.startsWith("/api/"),
    handler: new NetworkOnly(),
  },
  // Shared lists server-render someone else's list title for the link preview, so the
  // document is not public data. NetworkOnly kept it off disk but sent every offline
  // reload to the /offline fallback, which made the offline write queue unreachable in
  // exactly the shop-with-no-signal case it exists for. NetworkFirst with a short life
  // plus purgeOfflineCache deleting this bucket on a change of identity is the trade.
  // Its own bucket, not defaultCache's "pages": two ExpirationPlugins over one cache
  // each trim it to their own maxEntries and then disagree about what is still there.
  // Must stay above defaultCache, which is matched in order.
  {
    matcher: ({ url, sameOrigin }) =>
      sameOrigin && url.pathname.startsWith("/s/"),
    handler: new NetworkFirst({
      cacheName: "shared-list-pages",
      networkTimeoutSeconds: 5,
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 24 * 60 * 60 }),
      ],
    }),
  },
  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
