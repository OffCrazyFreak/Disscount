"use client";

import { IWatchlistItemWithProduct } from "@/app/(user)/watchlist/utils/watchlist-utils";
import { useWatchlistItem } from "@/app/(user)/watchlist/hooks/use-watchlist-item";
import WatchlistItemDiscountInfo from "@/app/(user)/watchlist/components/watchlist-item-discount-info";
import WatchlistActionButton from "@/app/(user)/watchlist/components/watchlist-action-button";
import WatchlistThresholdBadges from "@/app/(user)/watchlist/components/watchlist-threshold-badges";
import ProductCard from "@/components/custom/product/product-card";
import useProductNavigation from "@/hooks/use-product-navigation";

interface IWatchlistItemProps {
  item: IWatchlistItemWithProduct;
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
    category,
    hasPinnedStores,
    preferredStores,
    totalStores,
    isWatchRequirementAchieved,
    handleBadgeClick,
    handleOpenWatchlistModal,
  } = useWatchlistItem(item);

  const navigateToProduct = useProductNavigation();

  return (
    <ProductCard
      name={productName}
      brand={productBrand}
      category={category}
      quantity={quantityWithUnit}
      isLoading={isLoading}
      onClick={() => navigateToProduct(productApiId, product)}
      trailing={
        <>
          <WatchlistItemDiscountInfo
            discountInfo={discountInfo}
            hasPinnedStores={hasPinnedStores}
            preferredStores={preferredStores}
            totalStores={totalStores}
            isLoading={isLoading}
            error={error}
          />

          <div className="flex flex-col items-center gap-2 sm:flex-row-reverse">
            <WatchlistActionButton
              visibilityClassName="size-8 sm:size-10 shrink-0"
              isAddMode={isAddMode}
              isRemoving={isRemoving}
              hasProduct={Boolean(product)}
              onAdd={handleOpenWatchlistModal}
              onRemove={handleRemove}
            />

            {showThresholdBadges && (
              <WatchlistThresholdBadges
                items={watchlistItems}
                disabled={!product}
                isAchieved={isWatchRequirementAchieved}
                onEdit={handleBadgeClick}
              />
            )}
          </div>
        </>
      }
    />
  );
}
