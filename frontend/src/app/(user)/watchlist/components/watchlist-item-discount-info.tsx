import { Star, Store } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import WatchlistDiscountRow from "@/app/(user)/watchlist/components/watchlist-discount-row";
import { formatDifference } from "@/app/(user)/watchlist/utils/discount-display-utils";
import { IDiscountInfo } from "@/app/(user)/watchlist/utils/watchlist-utils";
import type { INotificationStore } from "@/context/notifications-types";

interface IWatchlistItemDiscountInfoProps {
  discountInfo: IDiscountInfo | null;
  hasPinnedStores: boolean;
  preferredStores: INotificationStore[];
  totalStores: INotificationStore[];
  isLoading: boolean;
  error: Error | null;
}

export default function WatchlistItemDiscountInfo({
  discountInfo,
  hasPinnedStores,
  preferredStores,
  totalStores,
  isLoading,
  error,
}: IWatchlistItemDiscountInfoProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-24 ml-auto" />
        <Separator />
        <Skeleton className="h-4 w-20 ml-auto" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">Greška pri učitavanju</p>;
  }

  if (!discountInfo) {
    return <p className="text-sm text-muted-foreground">Nema podataka</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {hasPinnedStores ? (
        <WatchlistDiscountRow
          icon={Star}
          difference={discountInfo.preferredDifference}
          text={formatDifference(
            discountInfo.preferredDifference,
            discountInfo.preferredPercentage,
            "Nedostupno",
          )}
          stores={preferredStores}
          bold
        />
      ) : (
        <div className="flex items-center justify-start gap-2">
          <Star className="size-4 sm:size-5 text-gray-700" />

          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer italic"
            onClick={() =>
              openModalUrl({ name: "settings", tab: "preference" })
            }
          >
            Postavi preference
          </button>
        </div>
      )}

      <Separator />

      <WatchlistDiscountRow
        icon={Store}
        difference={discountInfo.totalDifference}
        text={formatDifference(
          discountInfo.totalDifference,
          discountInfo.totalPercentage,
          "Nema podataka",
        )}
        stores={totalStores}
        tooltipSide="bottom"
      />
    </div>
  );
}
