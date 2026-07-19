import { PinnedStoreDto, WatchlistItemDto } from "@/lib/api/types";
import { normalizeForSearch } from "@/utils/strings";
import { GroupedWatchlistItems } from "@/app/(user)/watchlist/utils/watchlist-types";

export function extractPinnedStoreChainCodes(
  pinnedStores: PinnedStoreDto[] | null | undefined,
): string[] {
  if (!pinnedStores || pinnedStores.length === 0) {
    return [];
  }

  return pinnedStores
    .map((store) => {
      const primaryNamePart = store.storeName?.trim().split(/\s+/)[0] || "";

      return normalizeForSearch(primaryNamePart).toUpperCase();
    })
    .filter((chainCode) => chainCode.length > 0);
}

export function groupWatchlistItemsByProduct(
  watchlistItems: WatchlistItemDto[],
): GroupedWatchlistItems[] {
  const groups = new Map<string, WatchlistItemDto[]>();

  for (const watchlistItem of watchlistItems) {
    const existing = groups.get(watchlistItem.productApiId);

    if (existing) {
      existing.push(watchlistItem);
    } else {
      groups.set(watchlistItem.productApiId, [watchlistItem]);
    }
  }

  return Array.from(groups.entries()).map(([productApiId, groupedItems]) => ({
    productApiId,
    watchlistItems: groupedItems,
  }));
}
