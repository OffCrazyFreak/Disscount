/** Anything that is not a letter or digit starts a new word, post-normalization. */
const WORD_BOUNDARY = /[^a-z0-9]/;

/** Without a floor, the letters of "kupovina" appear in order in any Croatian paragraph, matching every query. */
const MIN_DENSITY = 0.15;

/** Lets "vgorica" find "Velika Gorica"; not `command-score`, as a server component imports this without React. */
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

    // Picking up where the last character left off means one run, a much better match than scattered letters.
    if (i > 0 && found === cursor) contiguous++;
    if (found === 0 || WORD_BOUNDARY.test(haystack[found - 1])) wordStarts++;

    cursor = found + 1;
  }

  // Each term is 0..1 and the weights sum to 1, so the result needs no clamping.
  const runs = contiguous / query.length;
  const starts = wordStarts / query.length;

  return 0.35 * density + 0.4 * runs + 0.25 * starts;
}
