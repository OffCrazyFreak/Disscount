const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/**
 * Named freshness windows, so a staleTime reads as an intent instead of a number.
 *
 * These say how long data is considered fresh, not how long it is kept. Retention
 * is gcTime, set once in the provider to match the offline persister's maxAge.
 */
export const CACHE_TIMES = {
  /** Anything unremarkable. Long enough that a renavigation does not refetch. */
  default: MINUTE,
  /** Products and prices: the upstream feed publishes once a day. */
  products: 6 * HOUR,
  /** Chains change when a retailer enters or leaves the market. */
  chains: HOUR,
  /** Store lists change when a chain opens or closes a location. */
  stores: 30 * MINUTE,
  /** The newest archived day can still be revised upstream. */
  priceHistoryEdge: MINUTE,
  /** Older archived days never change again. */
  priceHistoryArchived: 6 * HOUR,
  /** A health probe that is cached is not a health probe. */
  health: 30 * 1000,
} as const;
