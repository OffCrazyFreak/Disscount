import { Star, Store } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { DiscountInfo } from "@/app/(user)/watchlist/utils/watchlist-utils";
import { cn } from "@/lib/utils";

interface WatchlistItemDiscountInfoProps {
  discountInfo: DiscountInfo | null;
  hasPinnedStores: boolean;
  isLoading: boolean;
  error: Error | null;
}

export default function WatchlistItemDiscountInfo({
  discountInfo,
  hasPinnedStores,
  isLoading,
  error,
}: WatchlistItemDiscountInfoProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-24 ml-auto" />
        <Separator className="" />
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
      <div className="flex items-center justify-start gap-2">
        <Star
          className={cn("size-4 sm:size-5", {
            "text-red-700": (discountInfo.preferredDifference ?? 0) > 0,
            "text-green-700": (discountInfo.preferredDifference ?? 0) < 0,
            "text-gray-700": (discountInfo.preferredDifference ?? 0) === 0,
          })}
        />

        {hasPinnedStores ? (
          <p
            className={cn("text-sm font-bold", {
              "text-red-700": (discountInfo.preferredDifference ?? 0) > 0,
              "text-green-700": (discountInfo.preferredDifference ?? 0) < 0,
              "text-gray-700": (discountInfo.preferredDifference ?? 0) === 0,
            })}
          >
            {discountInfo.preferredDifference !== null &&
            discountInfo.preferredPercentage !== null
              ? `${discountInfo.preferredDifference > 0 ? "+" : ""}${discountInfo.preferredDifference.toFixed(2)}€ (${Math.round(Math.abs(discountInfo.preferredPercentage))}%)`
              : "Nema podataka"}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Nema odabranih trgovina
          </p>
        )}
      </div>

      <Separator className="" />

      <div className="flex items-center justify-start gap-2">
        <Store
          className={cn("size-4 sm:size-5", {
            "text-red-700": (discountInfo.totalDifference ?? 0) > 0,
            "text-green-700": (discountInfo.totalDifference ?? 0) < 0,
            "text-gray-700": (discountInfo.totalDifference ?? 0) === 0,
          })}
        />

        <p
          className={cn(
            "text-sm font-medium text-right flex gap-2 flex-wrap items-center justify-end transition-all",
            {
              "text-red-700": (discountInfo.totalDifference ?? 0) > 0,
              "text-green-700": (discountInfo.totalDifference ?? 0) < 0,
              "text-gray-700": (discountInfo.totalDifference ?? 0) === 0,
            },
          )}
        >
          {discountInfo.totalDifference !== null &&
          discountInfo.totalPercentage !== null
            ? `${discountInfo.totalDifference > 0 ? "+" : ""}${discountInfo.totalDifference.toFixed(2)}€ (${Math.round(Math.abs(discountInfo.totalPercentage))}%)`
            : "Nema podataka"}
        </p>
      </div>
    </div>
  );
}
