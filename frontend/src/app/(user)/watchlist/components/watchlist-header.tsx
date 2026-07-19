import LastSyncedLabel from "@/components/custom/offline/last-synced-label";
import CreateDiscountedListButton from "@/app/(user)/watchlist/components/create-discounted-list-button";
import { WatchlistItemWithProduct } from "@/app/(user)/watchlist/utils/watchlist-utils";

interface IWatchlistHeaderProps {
  query: string;
  itemCount: number;
  showCount: boolean;
  pricesUpdatedAt: number;
  discountedItems: WatchlistItemWithProduct[];
  productsLoading: boolean;
}

export default function WatchlistHeader({
  query,
  itemCount,
  showCount,
  pricesUpdatedAt,
  discountedItems,
  productsLoading,
}: IWatchlistHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex flex-col">
        <h3>
          {query.length > 0
            ? `Rezultati pretrage za "${query}" (${itemCount})`
            : `Praćeni proizvodi${showCount ? ` (${itemCount})` : ""}`}
        </h3>

        {pricesUpdatedAt > 0 && (
          <LastSyncedLabel
            updatedAt={pricesUpdatedAt}
            prefix="Cijene osvježene"
          />
        )}
      </div>

      {/* Stays mounted through a background price refetch, which would
          otherwise pop the button off screen and back. */}
      <CreateDiscountedListButton
        discountedItems={discountedItems}
        isLoading={productsLoading}
      />
    </div>
  );
}
