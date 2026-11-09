import { normalizeForSearch } from "@/utils/strings";

/** `null` means no query, which every caller reads as "match everything". */
export interface IPreparedQuery {
  normalized: string;
  tokens: string[];
}

/** City names repeat per keypress; eviction drops the oldest half, as a full clear would miss the whole pass. */
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

// cmdk calls the filter per option, so this one entry stops re-normalizing for every row of every keystroke.
let lastRaw: string | null = null;
let lastPrepared: IPreparedQuery | null = null;

export function prepareQuery(query: string): IPreparedQuery | null {
  if (query === lastRaw) return lastPrepared;

  const normalized = normalizeForSearch(query).trim();

  // Frozen because every caller shares this object, so changing `tokens` would corrupt the next holder's query.
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
