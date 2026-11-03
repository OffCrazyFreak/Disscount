import { useTranslations } from "next-intl";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import WatchlistItem from "@/app/[locale]/(user)/watchlist/components/watchlist-item";
import { IWatchlistSearchItem } from "@/lib/watchlist/watchlist-types";

interface IWatchlistSuggestionsProps {
  items: IWatchlistSearchItem[];
  isLoading: boolean;
}

export default function WatchlistSuggestions({
  items,
  isLoading,
}: IWatchlistSuggestionsProps) {
  const t = useTranslations("watchlist");

  return (
    <div className="space-y-2">
      <h2 className="py-2 text-lg font-semibold">
        {t("suggestions.title", {
          label: t("suggestions.label"),
          count: items.length,
        })}
      </h2>

      {isLoading ? (
        <div className="grid place-items-center py-6">
          <BlockLoadingSpinner />
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <WatchlistItem
              key={`suggestion-${item.productApiId}`}
              item={item}
              actionMode="add"
              showThresholdBadges={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
