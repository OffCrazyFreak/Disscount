import { normalizeCached, type IPreparedQuery } from "@/utils/search/normalize";
import { subsequenceScore } from "@/utils/search/fuzzy";

/** How well the whole query sits in the text, best tier first. */
export const MATCH_TIER = {
  exact: 0,
  prefix: 1,
  wordPrefix: 2,
  contains: 3,
  none: 4,
} as const;

export const NO_POSITION = Number.MAX_SAFE_INTEGER;

export interface IWholeQueryMatch {
  tier: number;
  position: number;
}

/**
 * Where and how well `query` sits in `haystack`.
 *
 * Both arguments must already be normalized. Callers comparing one query
 * against many texts normalize each text once, so normalizing in here would
 * undo that.
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

/** One band per tier, wide enough to hold the position tie-breaker below it. */
const TIER_SCORE = [1, 0.8, 0.6, 0.4];

/** Every token landed, but never as one run. Ranks under any whole-query hit. */
const SCATTERED_SCORE = 0.25;

/** Sub-sequence hits rank under every literal hit, so they never displace a real match. */
const FUZZY_BAND = 0.2;

/**
 * Scores one candidate against a prepared query, best field wins.
 *
 * Pass only the fields that are actually meaningful to a human. Several option
 * lists carry an opaque value (a chain code, a list UUID), and including those
 * surfaces rows with nothing visible to explain the hit.
 *
 * Returns 0 for no match; higher is better.
 */
export function scoreFields(fields: string[], query: IPreparedQuery): number {
  const haystacks: string[] = [];
  for (const field of fields) {
    if (field) haystacks.push(normalizeCached(field));
  }
  if (!haystacks.length) return 0;

  // Every token has to land somewhere, so "bas put" still finds "Baska Krivi Put".
  const matchedEveryToken = query.tokens.every((token) =>
    haystacks.some((haystack) => haystack.includes(token)),
  );

  if (matchedEveryToken) {
    let best: IWholeQueryMatch = {
      tier: MATCH_TIER.none,
      position: NO_POSITION,
    };

    for (const haystack of haystacks) {
      const match = findWholeQuery(haystack, query.normalized);
      const better =
        match.tier < best.tier ||
        (match.tier === best.tier && match.position < best.position);

      if (better) best = match;
    }

    if (best.tier !== MATCH_TIER.none) {
      // Earlier matches win inside a tier without ever reaching the tier above.
      return TIER_SCORE[best.tier] - Math.min(best.position, 99) / 1000;
    }

    return SCATTERED_SCORE;
  }

  let fuzzy = 0;
  for (const haystack of haystacks) {
    fuzzy = Math.max(fuzzy, subsequenceScore(haystack, query.normalized));
  }

  return fuzzy * FUZZY_BAND;
}
