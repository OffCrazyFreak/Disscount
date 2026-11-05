import { useTranslations } from "next-intl";
import LastSyncedLabel from "@/components/custom/offline/last-synced-label";
import CreateDiscountedListButton from "@/app/[locale]/(user)/watchlist/components/create-discounted-list-button";
import { IWatchlistItemWithProduct } from "@/app/[locale]/(user)/watchlist/utils/watchlist-utils";

interface IWatchlistHeaderProps {
  query: string;
  itemCount: number;
  pricesUpdatedAt: number;
  discountedItems: IWatchlistItemWithProduct[];
  productsLoading: boolean;
}

export default function WatchlistHeader({
  query,
  itemCount,
  pricesUpdatedAt,
  discountedItems,
  productsLoading,
}: IWatchlistHeaderProps) {
  const t = useTranslations("watchlist");

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex flex-col">
        {/* The tab already names the list; only a search needs its own line. */}
        {query.length > 0 && (
          <h3>{t("header.searchResultsTitle", { query, count: itemCount })}</h3>
        )}

        {pricesUpdatedAt > 0 && (
          <LastSyncedLabel
            updatedAt={pricesUpdatedAt}
            label={(time) => t("header.pricesUpdated", { time })}
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
