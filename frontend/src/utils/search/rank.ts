export type Comparator<T> = (a: T, b: T) => number;

/**
 * Runs comparators in order and returns the first non-zero verdict, so ranking
 * reads as a priority list rather than one arithmetic score.
 *
 * The first term is whatever the list leads on (search relevance, or a flag such
 * as "this one hit the user's threshold"), with domain tie-breakers after it:
 * discount size, how widely stocked a product is, how many locations carry it.
 */
export function chainComparators<T>(
  ...comparators: Array<Comparator<T>>
): Comparator<T> {
  return (a, b) => {
    for (const compare of comparators) {
      const verdict = compare(a, b);
      if (verdict !== 0) return verdict;
    }

    return 0;
  };
}

/** Highest first. Use for scores, counts and popularity. */
export function byDesc<T>(pick: (item: T) => number): Comparator<T> {
  return (a, b) => pick(b) - pick(a);
}

/** Lowest first. Use for match position, price and anything where smaller wins. */
export function byAsc<T>(pick: (item: T) => number): Comparator<T> {
  return (a, b) => pick(a) - pick(b);
}
