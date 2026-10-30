import type { CityPrices } from "@/lib/cijene-api/location-prices/reduce-prices";

export interface IPriceCache {
  get(key: string): Promise<CityPrices> | undefined;
  set(key: string, value: Promise<CityPrices>): void;
}

interface IPriceCacheOptions {
  ttlMs: number;
  maxEntries: number;
  now?: () => number;
}

/**
 * In-memory, per server process. Holds promises, so concurrent searches for
 * the same city share one upstream request instead of each spending quota.
 */
export function createPriceCache({
  ttlMs,
  maxEntries,
  now = Date.now,
}: IPriceCacheOptions): IPriceCache {
  const entries = new Map<
    string,
    { value: Promise<CityPrices>; expires: number }
  >();

  return {
    get(key) {
      const entry = entries.get(key);
      if (!entry) return undefined;

      if (entry.expires <= now()) {
        entries.delete(key);
        return undefined;
      }

      return entry.value;
    },

    set(key, value) {
      entries.delete(key);
      if (entries.size >= maxEntries) {
        const oldest = entries.keys().next().value;
        if (oldest !== undefined) entries.delete(oldest);
      }

      entries.set(key, { value, expires: now() + ttlMs });

      // A failure must not be served from the cache for the next hour.
      value.catch(() => {
        if (entries.get(key)?.value === value) entries.delete(key);
      });
    },
  };
}
