/** Anything that is not a letter or digit starts a new word, post-normalization. */
const WORD_BOUNDARY = /[^a-z0-9]/;

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
  const density = query.length / haystack.length;
  const runs = contiguous / query.length;
  const starts = wordStarts / query.length;

  return 0.35 * density + 0.4 * runs + 0.25 * starts;
}
