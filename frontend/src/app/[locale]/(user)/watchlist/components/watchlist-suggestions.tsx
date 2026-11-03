import WatchlistItem from "@/app/[locale]/(user)/watchlist/components/watchlist-item";
import { IWatchlistSearchItem } from "@/lib/watchlist/watchlist-types";

interface IWatchlistSuggestionsProps {
  items: IWatchlistSearchItem[];
}

export default function WatchlistSuggestions({
  items,
}: IWatchlistSuggestionsProps) {
  return (
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
  );
}
