import type { SerwistPlugin } from "serwist";

/**
 * Serwist caches by status only, so a response the server marked `no-store`
 * (store hours before their first import) would otherwise be served again.
 */
export const skipNoStore: SerwistPlugin = {
  cacheWillUpdate: async ({ response }) =>
    /\bno-store\b/i.test(response.headers.get("cache-control") ?? "")
      ? null
      : response,
};
