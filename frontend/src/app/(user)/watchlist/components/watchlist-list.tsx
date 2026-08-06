import Link from "next/link";
import { Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import NoResults from "@/components/custom/common/no-results";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import WatchlistItem from "@/app/(user)/watchlist/components/watchlist-item";
import { sortWatchlistItemsByDiscount } from "@/app/(user)/watchlist/utils/watchlist-utils";
import { IWatchlistSearchItem } from "@/app/(user)/watchlist/typings/watchlist-types";

interface IWatchlistListProps {
  items: IWatchlistSearchItem[];
  isLoading: boolean;
  query: string;
  hasPinnedStores: boolean;
}

export default function WatchlistList({
  items,
  isLoading,
  query,
  hasPinnedStores,
}: IWatchlistListProps) {
  if (isLoading) {
    return (
      <div className="grid place-items-center">
        <BlockLoadingSpinner />
      </div>
    );
  }

  if (items.length > 0) {
    return (
      <div className="space-y-3">
        {sortWatchlistItemsByDiscount(items, hasPinnedStores).map((item) => (
          <WatchlistItem key={item.productApiId} item={item} />
        ))}
      </div>
    );
  }

  if (query) {
    return (
      <NoResults
        icon={<Search className="size-12 text-gray-400 mx-auto mb-4" />}
      />
    );
  }

  return (
    <div className="text-center py-12">
      <Eye className="size-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Nema praćenih proizvoda
      </h3>

      <p className="text-gray-600 mb-6">
        Pretraži proizvode, odaberi “Prati proizvod” i primaj obavijesti o
        popustima.
      </p>

      <Button asChild effect="shineHover">
        <Link href="/products">
          <Search aria-hidden="true" className="size-5" />
          Pretraži proizvode
        </Link>
      </Button>
    </div>
  );
}
