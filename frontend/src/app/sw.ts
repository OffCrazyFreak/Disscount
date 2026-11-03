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
  // The cached set of list URLs reveals which lists this device opened, including
  // someone else's reached by link, so it is not public data. The documents themselves
  // carry no list content: the page renders a client component from the id alone. NetworkOnly kept it off disk
  // but sent every offline reload to the /offline fallback, which made the offline write
  // queue unreachable in exactly the shop-with-no-signal case it exists for. NetworkFirst
  // with a short life plus purgeOfflineCache deleting this bucket on a change of identity
  // is the trade. Its own bucket, not defaultCache's: two ExpirationPlugins over one
  // cache each trim it to their own maxEntries and then disagree about what is still
  // there. Must stay above defaultCache, which is matched in order.
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
  // The bare wallet URL never gets here: the precache answers it first. Its ?q= and
  // modal variants stay out of defaultCache's 24 hour page bucket, where a copy from an
  // older build would point at chunks the next deploy deleted; offline, the fallback
  // below serves this build's precached wallet instead.
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
  // Off so a deploy waits for the reload the app offers; the old worker keeps
  // serving the chunks open tabs still ask for until then.
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    // First match wins: a wallet document gets this build's wallet in its own
    // language, any other document the precached offline page.
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
