"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { watchlistService } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import {
  isWatchThresholdReached,
  WatchlistItemWithProduct,
} from "@/app/(user)/watchlist/utils/watchlist-utils";
import { useUser } from "@/context/user-context";
import { cn } from "@/lib/utils";
import WatchlistItemDiscountInfo from "@/app/(user)/watchlist/components/watchlist-item-discount-info";
import WatchlistItemModal from "@/app/products/components/forms/watchlist-item-modal";
import { WatchType } from "@/lib/api";
import { formatQuantity } from "@/utils/strings";

interface WatchlistItemProps {
  item: WatchlistItemWithProduct;
  actionMode?: "remove" | "add";
  showThresholdBadges?: boolean;
}

export default function WatchlistItem({
  item,
  actionMode = "remove",
  showThresholdBadges = true,
}: WatchlistItemProps) {
  const {
    watchlistItems,
    productApiId,
    product,
    discountInfo,
    isLoading,
    error,
  } = item;
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [isRemoving, setIsRemoving] = useState(false);
  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState(false);
  const [selectedWatchType, setSelectedWatchType] = useState<WatchType>(
    WatchType.percentage,
  );
  const isAddMode = actionMode === "add";

  async function handleRemove() {
    try {
      setIsRemoving(true);

      await Promise.all(
        watchlistItems.map((watchlistItem) =>
          watchlistService.removeFromWatchlist(watchlistItem.id),
        ),
      );

      queryClient.invalidateQueries({
        queryKey: watchlistService.QUERY_KEYS.all,
      });

      toast.success("Proizvod uklonjen s popisa za praćenje");
    } catch {
      toast.error("Greška pri uklanjanju proizvoda");
    } finally {
      setIsRemoving(false);
    }
  }

  // Display product name from API only (no fallback since productName removed from backend)
  const productName = product?.name || "Učitavanje...";
  const productBrand = product?.brand || null;
  const formattedQuantity = formatQuantity(product?.quantity);
  const quantityWithUnit =
    formattedQuantity && product?.unit
      ? `${formattedQuantity}${product.unit}`
      : null;

  const hasPinnedStores = (user?.pinnedStores?.length || 0) > 0;

  function isWatchRequirementAchieved(
    thresholdValue: number,
    watchType: WatchType,
  ): boolean {
    if (!discountInfo) {
      return false;
    }

    return isWatchThresholdReached(
      discountInfo,
      watchType,
      thresholdValue,
      hasPinnedStores,
    );
  }

  function handleBadgeClick(
    event: React.MouseEvent<HTMLButtonElement>,
    watchType: WatchType,
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (!product) {
      return;
    }

    setSelectedWatchType(watchType);
    setIsWatchlistModalOpen(true);
  }

  function handleOpenWatchlistModal() {
    if (!product) {
      return;
    }

    setSelectedWatchType(WatchType.percentage);
    setIsWatchlistModalOpen(true);
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      {product && (
        <WatchlistItemModal
          isOpen={isWatchlistModalOpen}
          onOpenChange={setIsWatchlistModalOpen}
          product={product}
          initialWatchType={selectedWatchType}
        />
      )}

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

            <Button
              size="icon"
              aria-label={isAddMode ? "Dodaj proizvod" : "Ukloni proizvod"}
              className={cn(
                "sm:hidden size-8 sm:size-10 shrink-0",
                isAddMode
                  ? "bg-primary hover:bg-primary/90"
                  : "bg-red-600 hover:bg-red-700",
              )}
              onClick={isAddMode ? handleOpenWatchlistModal : handleRemove}
              disabled={isAddMode ? !product : isRemoving}
            >
              {isAddMode ? (
                <Eye className="size-5 sm:size-6" />
              ) : isRemoving ? (
                <Loader2 className="size-5 sm:size-6 animate-spin" />
              ) : (
                <X className="size-5 sm:size-6" />
              )}
            </Button>
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
            <Button
              size="icon"
              aria-label={isAddMode ? "Dodaj proizvod" : "Ukloni proizvod"}
              className={cn(
                "hidden sm:flex size-8 sm:size-10 shrink-0",
                isAddMode
                  ? "bg-primary hover:bg-primary/90"
                  : "bg-red-600 hover:bg-red-700",
              )}
              onClick={isAddMode ? handleOpenWatchlistModal : handleRemove}
              disabled={isAddMode ? !product : isRemoving}
            >
              {isAddMode ? (
                <Eye className="size-5 sm:size-6" />
              ) : isRemoving ? (
                <Loader2 className="size-5 sm:size-6 animate-spin" />
              ) : (
                <X className="size-5 sm:size-6" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
