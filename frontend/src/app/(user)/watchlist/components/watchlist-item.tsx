"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { WatchlistItemWithProduct } from "@/app/(user)/watchlist/utils/watchlist-utils";
import { cn } from "@/lib/utils";
import WatchlistItemDiscountInfo from "@/app/(user)/watchlist/components/watchlist-item-discount-info";
import WatchlistActionButton from "@/app/(user)/watchlist/components/watchlist-action-button";
import { useWatchlistItem } from "@/app/(user)/watchlist/hooks/use-watchlist-item";
import { WatchType } from "@/lib/api";

interface IWatchlistItemProps {
  item: WatchlistItemWithProduct;
  actionMode?: "remove" | "add";
  showThresholdBadges?: boolean;
}

export default function WatchlistItem({
  item,
  actionMode = "remove",
  showThresholdBadges = true,
}: IWatchlistItemProps) {
  const {
    watchlistItems,
    productApiId,
    product,
    discountInfo,
    isLoading,
    error,
  } = item;
  const isAddMode = actionMode === "add";

  const {
    isRemoving,
    handleRemove,
    productName,
    productBrand,
    quantityWithUnit,
    hasPinnedStores,
    isWatchRequirementAchieved,
    handleBadgeClick,
    handleOpenWatchlistModal,
  } = useWatchlistItem(item);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* First row: Product name, brand, and remove button */}
        <div className="flex  justify-between gap-4 sm:flex-row flex-col">
          <div className="flex items-center justify-between gap-4">
            {/* Product info - clickable */}
            <Link href={`/products/${productApiId}`}>
              <div className="space-y-2 w-fit">
                {isLoading ? (
                  <>
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </>
                ) : (
                  <>
                    <h4 className="text-sm sm:text-md hover:text-primary transition-colors">
                      {productName}
                      {quantityWithUnit ? ` (${quantityWithUnit})` : ""}
                    </h4>
                    {productBrand && (
                      <p className="text-xs sm:text-sm text-gray-600">
                        {productBrand}
                      </p>
                    )}
                  </>
                )}
              </div>
            </Link>

            <WatchlistActionButton
              visibilityClassName="sm:hidden size-8 sm:size-10 shrink-0"
              isAddMode={isAddMode}
              isRemoving={isRemoving}
              hasProduct={Boolean(product)}
              onAdd={handleOpenWatchlistModal}
              onRemove={handleRemove}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center justify-between gap-4 w-full">
              {/* Discount info */}
              <WatchlistItemDiscountInfo
                discountInfo={discountInfo}
                hasPinnedStores={hasPinnedStores}
                isLoading={isLoading}
                error={error}
              />

              {/* Threshold badges */}
              {showThresholdBadges && (
                <div className="flex flex-col items-center justify-center gap-2">
                  {[...watchlistItems]
                    .sort((a, b) =>
                      a.watchType === WatchType.percentage
                        ? -1
                        : b.watchType === WatchType.percentage
                          ? 1
                          : 0,
                    )
                    .map((watchlistItem) => (
                      <Badge
                        key={watchlistItem.id}
                        variant="outline"
                        asChild
                        className={cn(
                          "text-xs cursor-pointer",
                          isWatchRequirementAchieved(
                            watchlistItem.thresholdValue,
                            watchlistItem.watchType,
                          ) &&
                            "border-green-600 bg-green-50 text-green-700 font-bold",
                        )}
                      >
                        <button
                          type="button"
                          onClick={(event) =>
                            handleBadgeClick(event, watchlistItem.watchType)
                          }
                          disabled={!product}
                        >
                          {watchlistItem.watchType === "ABSOLUTE"
                            ? `- ${watchlistItem.thresholdValue.toFixed(2)}€`
                            : `- ${Math.round(watchlistItem.thresholdValue)}%`}
                        </button>
                      </Badge>
                    ))}
                </div>
              )}
            </div>

            {/* Remove button - hidden on mobile, shown on larger screens */}
            <WatchlistActionButton
              visibilityClassName="hidden sm:flex size-8 sm:size-10 shrink-0"
              isAddMode={isAddMode}
              isRemoving={isRemoving}
              hasProduct={Boolean(product)}
              onAdd={handleOpenWatchlistModal}
              onRemove={handleRemove}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
