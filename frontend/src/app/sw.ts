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
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/locales";
import {
  DEPLOYMENT_PARAM_PATTERN,
  ignoreDeploymentParam,
} from "@/lib/pwa/deployment-param";
import { OFFLINE_PAGE_PATH, WALLET_PAGE_PATH } from "@/lib/pwa/precached-pages";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const LOCALE_PREFIXES: string[] = LOCALES.filter(
  (locale) => locale !== DEFAULT_LOCALE,
);
const SHOPPING_LIST_PATH = new RegExp(
  `^(/(${LOCALE_PREFIXES.join("|")}))?/shopping-lists/`,
);

const WALLET_PATH = new RegExp(
  `^(/(${LOCALE_PREFIXES.join("|")}))?${WALLET_PAGE_PATH}/?$`,
);

function localePrefixOf(pathname: string): string {
  const segment = pathname.split("/")[1];
  return LOCALE_PREFIXES.includes(segment) ? `/${segment}` : "";
}

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
  // Above defaultCache (first match wins); own bucket for expiry; NetworkFirst, as NetworkOnly cuts off the queue.
  {
    matcher: ({ url, sameOrigin }) =>
      sameOrigin && SHOPPING_LIST_PATH.test(url.pathname),
    handler: new NetworkFirst({
      cacheName: "shopping-list-pages",
      networkTimeoutSeconds: 5,
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 24 * 60 * 60 }),
      ],
    }),
  },
  // ?q= and modal variants stay out of the page bucket, where an old copy points at deleted chunks.
  {
    matcher: ({ url, request, sameOrigin }) =>
      sameOrigin &&
      request.destination === "document" &&
      WALLET_PATH.test(url.pathname),
    // Lie-fi at the till: give up on the network quickly and open the cards.
    handler: new NetworkOnly({ networkTimeoutSeconds: 3 }),
  },
  ...ignoreDeploymentParam(defaultCache),
];

const PAGE_PREFIXES = ["", ...LOCALE_PREFIXES.map((locale) => `/${locale}`)];

function isDocumentIn(request: Request, prefix: string): boolean {
  return (
    request.destination === "document" &&
    localePrefixOf(new URL(request.url).pathname) === prefix
  );
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    // The precache keys carry no ?dpl=; the first two are Serwist's defaults.
    ignoreURLParametersMatching: [
      /^utm_/,
      /^fbclid$/,
      DEPLOYMENT_PARAM_PATTERN,
    ],
  },
  // Off so a deploy waits for the reload the app offers, and the old worker keeps serving the chunks open tabs ask for.
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    // First match wins: wallet documents get this build's wallet, others the offline page.
    entries: [
      ...PAGE_PREFIXES.map((prefix) => ({
        url: `${prefix}${WALLET_PAGE_PATH}`,
        matcher({ request }: { request: Request }) {
          return (
            isDocumentIn(request, prefix) &&
            WALLET_PATH.test(new URL(request.url).pathname)
          );
        },
      })),
      ...PAGE_PREFIXES.map((prefix) => ({
        url: `${prefix}${OFFLINE_PAGE_PATH}`,
        matcher({ request }: { request: Request }) {
          return isDocumentIn(request, prefix);
        },
      })),
    ],
  },
});

serwist.addEventListeners();
