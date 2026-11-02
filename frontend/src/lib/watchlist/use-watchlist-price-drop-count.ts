import { useEffect, useSyncExternalStore } from "react";
import { useUser } from "@/context/user-context";
import usePageVisible from "@/hooks/use-page-visible";
import { usePathname } from "@/i18n/navigation";
import { getCacheIdentity } from "@/lib/offline/cache-identity";
import { useWatchedProducts } from "@/lib/watchlist/use-watched-products";
import {
  countPriceDrops,
  getPriceScope,
  getScopedBestPriceCents,
  isSameSnapshot,
  nextPriceSnapshot,
} from "@/lib/watchlist/watchlist-price-drop-utils";
import type { WatchlistPriceSnapshot } from "@/typings/local-storage";
import {
  getWatchlistPriceSnapshot,
  readStoredWatchlistPriceSnapshot,
  setWatchlistPriceSnapshot,
  subscribeToWatchlistPriceSnapshots,
} from "@/utils/browser/storage/watchlist";
import { isRouteActive } from "@/utils/routes";

const WATCHLIST_HREF = "/watchlist";

interface IWatchlistPriceDrops {
  count: number;
  /** Signed in, with the watchlist and every price fetched and no refetch in flight */
  isSettled: boolean;
}

/**
 * Watched products whose best price fell since the user last opened /watchlist on this
 * device. Opening the page clears it. A stand-in until the server-side inbox (#222) can
 * answer with an unseen count shared across devices.
 */
export function useWatchlistPriceDropCount(): IWatchlistPriceDrops {
  const { user, isAuthenticated } = useUser();
  const pathname = usePathname();
  const {
    isWatchlistLoaded,
    isWatchlistFetching,
    groupedWatchlistItems,
    pinnedStoreChainCodes,
    productQueries,
  } = useWatchedProducts(isAuthenticated, user?.pinnedStores);

  const userId = isAuthenticated ? user?.id : undefined;
  const scope = getPriceScope(pinnedStoreChainCodes);
  const isOnWatchlist = isRouteActive(pathname, WATCHLIST_HREF);
  // A background tab left on the page refetches on reconnect; that is not the user looking.
  const isPageVisible = usePageVisible();
  const isVisit = isOnWatchlist && isPageVisible;

  // A failed preferences fetch leaves pinnedStores unset, which would read as "every
  // chain" and rebase away drops the user has not seen yet.
  const isScopeKnown = Array.isArray(user?.pinnedStores);

  const snapshot = useSyncExternalStore(
    subscribeToWatchlistPriceSnapshots,
    () => getWatchlistPriceSnapshot(userId),
    () => null,
  );

  const currentPrices: WatchlistPriceSnapshot = {};

  groupedWatchlistItems.forEach((item, index) => {
    const product = productQueries[index]?.data;
    if (!product) return;

    const price = getScopedBestPriceCents(product, pinnedStoreChainCodes);
    if (price !== null) currentPrices[item.productApiId] = price;
  });

  // Primitive keys, so the write runs only when this tab's own data changes. Re-running
  // on another tab's write would let two tabs that disagree overwrite each other forever.
  const pricesKey = JSON.stringify(currentPrices);
  const eansKey = groupedWatchlistItems
    .map((item) => item.productApiId)
    .join(",");
  const canWrite = Boolean(userId) && isWatchlistLoaded && isScopeKnown;

  useEffect(() => {
    // The identity switches before the profile does, so this stops a write for the
    // account that is leaving from recreating the snapshot the purge just deleted.
    if (!userId || !canWrite || getCacheIdentity() !== userId) return;

    // Merged against a fresh read, not the cached one, so another tab's visit survives.
    const latest = readStoredWatchlistPriceSnapshot(userId);
    const next = nextPriceSnapshot(
      JSON.parse(pricesKey) as WatchlistPriceSnapshot,
      latest,
      scope,
      eansKey ? eansKey.split(",") : [],
      isVisit,
    );

    if (!isSameSnapshot(next, latest)) setWatchlistPriceSnapshot(userId, next);
  }, [userId, canWrite, pricesKey, eansKey, scope, isVisit]);

  const isSettled =
    canWrite &&
    !isWatchlistFetching &&
    productQueries.every(
      (query) => query.status !== "pending" && !query.isFetching,
    );

  if (!userId || isOnWatchlist) return { count: 0, isSettled };

  return { count: countPriceDrops(currentPrices, snapshot, scope), isSettled };
}
