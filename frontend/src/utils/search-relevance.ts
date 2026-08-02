import { normalizeForSearch } from "@/utils/strings";

/** How well the whole query sits in the text, best tier first. */
export const MATCH_TIER = {
  exact: 0,
  prefix: 1,
  wordPrefix: 2,
  contains: 3,
  none: 4,
};

export const NO_POSITION = Number.MAX_SAFE_INTEGER;

export interface IWholeQueryMatch {
  tier: number;
  position: number;
}

/**
 * Where and how well `query` sits in `haystack`.
 *
 * Both arguments must already be normalized. Callers that compare one query
 * against many texts normalize each text once rather than once per comparison,
 * so normalizing in here would undo that.
 */
export function findWholeQuery(
  haystack: string,
  query: string,
): IWholeQueryMatch {
  if (haystack === query) return { tier: MATCH_TIER.exact, position: 0 };

  const position = haystack.indexOf(query);
  if (position === -1) return { tier: MATCH_TIER.none, position: NO_POSITION };
  if (position === 0) return { tier: MATCH_TIER.prefix, position };

  const startsWord = /[^a-z0-9]/.test(haystack[position - 1]);
  return {
    tier: startsWord ? MATCH_TIER.wordPrefix : MATCH_TIER.contains,
    position,
  };
}

/** One band per tier, wide enough to hold the position tie-breaker below. */
const TIER_SCORE = [1, 0.8, 0.6, 0.4];

/** All tokens matched, but never as one run. Ranks under every whole-query hit. */
const SCATTERED_SCORE = 0.2;

/**
 * Scores one option against a search query for cmdk's `filter`, which hides
 * anything scoring 0 and orders the rest by score descending.
 *
 * Case- and diacritic-blind on both sides, so "baska" offers "Baška". Pass the
 * visible label through `keywords` wherever it differs from the option's value,
 * or only the value is searchable.
 */
export function scoreOption(
  text: string,
  query: string,
  keywords?: string[],
): number {
  const normalizedQuery = normalizeForSearch(query).trim();
  if (!normalizedQuery) return 1;

  const haystacks = [text, ...(keywords ?? [])].map(normalizeForSearch);
  const tokens = normalizedQuery.split(/\s+/);

  // Every token has to land somewhere, so "bas put" still finds "Baška Krivi Put".
  const matchesEveryToken = tokens.every((token) =>
    haystacks.some((haystack) => haystack.includes(token)),
  );
  if (!matchesEveryToken) return 0;

  const best = haystacks
    .map((haystack) => findWholeQuery(haystack, normalizedQuery))
    .reduce((a, b) => (a.tier <= b.tier ? a : b));

  if (best.tier === MATCH_TIER.none) return SCATTERED_SCORE;

  // Earlier matches win inside a tier without ever reaching the tier above.
  return TIER_SCORE[best.tier] - Math.min(best.position, 99) / 1000;
}
