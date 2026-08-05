/** Anything that is not a letter or digit starts a new word, post-normalization. */
const WORD_BOUNDARY = /[^a-z0-9]/;

/**
 * How much of the haystack the query has to account for before a sub-sequence
 * counts as a match at all.
 *
 * Without a floor this is not a search, it is a coincidence detector: the eight
 * letters of "kupovina" appear in order somewhere inside any paragraph of
 * Croatian prose, so every blog post and every contact message matched every
 * query. An abbreviation of a label is dense ("vgorica" is more than half of
 * "velika gorica"); letters scattered through 600 characters are not.
 */
const MIN_DENSITY = 0.15;

/**
 * Scores a sub-sequence match: every character of the query appears in the
 * haystack in order, with gaps allowed. This is what lets "vgorica" find
 * "Velika Gorica", which the literal matcher cannot do.
 *
 * Written here rather than borrowed from cmdk's `command-score` because
 * `filterByFields` is imported by a server component, so the shared matcher
 * must not pull a React library into the server graph.
 *
 * Both arguments must already be normalized.
 */
export function subsequenceScore(haystack: string, query: string): number {
  if (!query) return 1;
  if (query.length > haystack.length) return 0;

  const density = query.length / haystack.length;
  if (density < MIN_DENSITY) return 0;

  let cursor = 0;
  let contiguous = 0;
  let wordStarts = 0;

  for (let i = 0; i < query.length; i++) {
    const found = haystack.indexOf(query[i], cursor);
    if (found === -1) return 0;

    // Picking up exactly where the last character left off means this pair sits
    // in one run, which reads as a much better match than the same letters scattered.
    if (i > 0 && found === cursor) contiguous++;
    if (found === 0 || WORD_BOUNDARY.test(haystack[found - 1])) wordStarts++;

    cursor = found + 1;
  }

  // The three terms are each 0..1 and the weights sum to 1, so the result is
  // already bounded and needs no clamping.
  const runs = contiguous / query.length;
  const starts = wordStarts / query.length;

  return 0.35 * density + 0.4 * runs + 0.25 * starts;
}
