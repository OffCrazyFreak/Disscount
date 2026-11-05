import { normalizeForSearch } from "@/utils/strings";

/** A pinned name ("Konzum Vukovarska") and chain code ("konzum"): either may be longer, so match both ways. */
/** Below this containment means nothing: a store "K plus" yields "k", inside konzum, kaufland and ktc. */
const MIN_CONTAINMENT_LENGTH = 3;

function chainMatchesPinnedStore(
  chain: string,
  pinnedStoreName: string,
): boolean {
  const chainKey = normalizeForSearch(chain).trim();
  const pinnedKey = normalizeForSearch(pinnedStoreName).trim();

  if (!chainKey || !pinnedKey) return false;
  if (chainKey === pinnedKey) return true;

  if (
    chainKey.length < MIN_CONTAINMENT_LENGTH ||
    pinnedKey.length < MIN_CONTAINMENT_LENGTH
  ) {
    return false;
  }

  return chainKey.includes(pinnedKey) || pinnedKey.includes(chainKey);
}

export function isPinnedChain(
  chain: string,
  pinnedStoreNames: string[],
): boolean {
  return pinnedStoreNames.some((name) => chainMatchesPinnedStore(chain, name));
}
