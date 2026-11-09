import type { SerwistPlugin } from "serwist";

/** Serwist caches by status only, so a `no-store` response (early store hours) would otherwise be served again. */
export const skipNoStore: SerwistPlugin = {
  cacheWillUpdate: async ({ response }) =>
    /\bno-store\b/i.test(response.headers.get("cache-control") ?? "")
      ? null
      : response,
};
