import { normalizeForSearch } from "@/utils/strings";

/**
 * A query normalized and tokenized once per keystroke rather than once per
 * candidate. `null` means there is no query, which every caller reads as
 * "match everything".
 */
export interface IPreparedQuery {
  normalized: string;
  tokens: string[];
}

/**
 * Option lists are stable between keystrokes, so the same strings get
 * normalized over and over: the Lokacije facet and the pinned-places select
 * both run over several hundred city names per keypress.
 *
 * Bounded and cleared wholesale rather than evicted one by one, because the
 * working set is a stable option list and a clear is cheaper than tracking
 * recency for something this small.
 */
const CACHE_LIMIT = 4096;
const cache = new Map<string, string>();

/** `normalizeForSearch`, memoized. Identical output, so it stays safe as an identity key. */
export function normalizeCached(value: string): string {
  const hit = cache.get(value);
  if (hit !== undefined) return hit;

  const normalized = normalizeForSearch(value);

  if (cache.size >= CACHE_LIMIT) cache.clear();
  cache.set(value, normalized);

  return normalized;
}

// cmdk calls the filter once per option, so without this the query would be
// re-normalized for every row of every keystroke. One entry is all it takes,
// since a pass only ever asks about the query the user just typed.
let lastRaw: string | null = null;
let lastPrepared: IPreparedQuery | null = null;

export function prepareQuery(query: string): IPreparedQuery | null {
  if (query === lastRaw) return lastPrepared;

  const normalized = normalizeForSearch(query).trim();
  const prepared = normalized
    ? { normalized, tokens: normalized.split(/\s+/) }
    : null;

  lastRaw = query;
  lastPrepared = prepared;

  return prepared;
}
