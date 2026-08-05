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
 * This only helps while the working set fits. Products are also scored through
 * here and a loaded list can hold thousands of distinct names and brands, which
 * is why eviction drops the oldest half rather than clearing: a wholesale clear
 * mid-pass would leave the rest of that same pass missing every lookup.
 */
const CACHE_LIMIT = 8192;
const cache = new Map<string, string>();

/** `normalizeForSearch`, memoized. Identical output, so it stays safe as an identity key. */
export function normalizeCached(value: string): string {
  const hit = cache.get(value);
  if (hit !== undefined) return hit;

  const normalized = normalizeForSearch(value);

  // Map iterates in insertion order, so the first half is the oldest half.
  if (cache.size >= CACHE_LIMIT) {
    const oldest = [...cache.keys()].slice(0, CACHE_LIMIT / 2);
    oldest.forEach((key) => cache.delete(key));
  }

  cache.set(value, normalized);

  return normalized;
}

// cmdk calls the filter once per option, so without this the query would be
// re-normalized for every row of every keystroke. One entry is all it takes for
// that loop, which is the case it exists for; two components filtering
// different queries in the same tick simply miss.
let lastRaw: string | null = null;
let lastPrepared: IPreparedQuery | null = null;

export function prepareQuery(query: string): IPreparedQuery | null {
  if (query === lastRaw) return lastPrepared;

  const normalized = normalizeForSearch(query).trim();

  // Frozen because every caller in the process shares this one object, module
  // state included on the server. A caller that sorted or pushed to `tokens`
  // would otherwise corrupt the query for whoever holds it next.
  const prepared = normalized
    ? Object.freeze({
        normalized,
        tokens: Object.freeze(normalized.split(/\s+/)) as string[],
      })
    : null;

  lastRaw = query;
  lastPrepared = prepared;

  return prepared;
}
