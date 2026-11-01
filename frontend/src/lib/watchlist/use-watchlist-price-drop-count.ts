import { useEffect, useSyncExternalStore } from "react";
import { useUser } from "@/context/user-context";
import { usePathname } from "@/i18n/navigation";
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
  setWatchlistPriceSnapshot,
  subscribeToWatchlistPriceSnapshots,
} from "@/utils/browser/storage/watchlist";
import { isRouteActive } from "@/utils/routes";

const WATCHLIST_HREF = "/watchlist";

interface IWatchlistPriceDrops {
  count: number;
  /** Signed in with the watchlist and every price loaded, so the count is final */
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
    groupedWatchlistItems,
    pinnedStoreChainCodes,
    productQueries,
  } = useWatchedProducts(isAuthenticated, user?.pinnedStores);

  const userId = isAuthenticated ? user?.id : undefined;
  const scope = getPriceScope(pinnedStoreChainCodes);
  const isVisit = isRouteActive(pathname, WATCHLIST_HREF);

  const snapshot = useSyncExternalStore(
    subscribeToWatchlistPriceSnapshots,
    () => getWatchlistPriceSnapshot(userId),
    () => getWatchlistPriceSnapshot(undefined),
  );

  const watchedEans = groupedWatchlistItems.map((item) => item.productApiId);
  const currentPrices: WatchlistPriceSnapshot = {};

  groupedWatchlistItems.forEach((item, index) => {
    const product = productQueries[index]?.data;
    if (!product) return;

    const price = getScopedBestPriceCents(product, pinnedStoreChainCodes);
    if (price !== null) currentPrices[item.productApiId] = price;
  });

  const next = nextPriceSnapshot(
    currentPrices,
    snapshot,
    scope,
    watchedEans,
    isVisit,
  );
  const hasChanged = !isSameSnapshot(next, snapshot);

  // Several nav surfaces mount this hook, and each computes the same next snapshot,
  // so only the first write changes anything.
  useEffect(() => {
    if (userId && isWatchlistLoaded && hasChanged) {
      setWatchlistPriceSnapshot(userId, next);
    }
  }, [userId, isWatchlistLoaded, hasChanged, next]);

  const isSettled =
    Boolean(userId) &&
    isWatchlistLoaded &&
    productQueries.every((query) => !query.isLoading);

  if (!userId || isVisit) return { count: 0, isSettled };

  return { count: countPriceDrops(currentPrices, snapshot, scope), isSettled };
}
