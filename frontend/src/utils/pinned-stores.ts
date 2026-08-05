import { normalizeForSearch } from "@/utils/strings";

/**
 * Does a product's chain belong to one of the user's pinned stores?
 *
 * The two sides never match exactly. A pinned store is saved by its display
 * name ("Konzum Vukovarska") while a product carries a chain code ("konzum"),
 * and depending on the source either one can be the longer string. So this is a
 * containment test in both directions, on the normalized forms.
 *
 * One function rather than the three that used to disagree: one folded
 * diacritics and tested one direction, one uppercased and tested both without
 * folding at all, so the same pinned store matched on one screen and not another.
 */
export function chainMatchesPinnedStore(
  chain: string,
  pinnedStoreName: string,
): boolean {
  const chainKey = normalizeForSearch(chain).trim();
  const pinnedKey = normalizeForSearch(pinnedStoreName).trim();

  if (!chainKey || !pinnedKey) return false;

  return chainKey.includes(pinnedKey) || pinnedKey.includes(chainKey);
}

/** True when the chain matches any of the pinned names or codes given. */
export function isPinnedChain(
  chain: string,
  pinnedStoreNames: string[],
): boolean {
  return pinnedStoreNames.some((name) => chainMatchesPinnedStore(chain, name));
}
