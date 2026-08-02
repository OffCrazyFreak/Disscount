"use client";

import { IWatchlistItemWithProduct } from "@/app/(user)/watchlist/utils/watchlist-utils";
import { useWatchlistItem } from "@/app/(user)/watchlist/hooks/use-watchlist-item";
import WatchlistItemDiscountInfo from "@/app/(user)/watchlist/components/watchlist-item-discount-info";
import WatchlistActionButton from "@/app/(user)/watchlist/components/watchlist-action-button";
import WatchlistThresholdBadges from "@/app/(user)/watchlist/components/watchlist-threshold-badges";
import ProductCard from "@/components/custom/product/product-card";
import ProductCardSkeleton from "@/components/custom/product/product-card-skeleton";
import { usePrimeProductNavigation } from "@/hooks/use-product-navigation";

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

  const primeProductNavigation = usePrimeProductNavigation();

  // The row knows its controls before it knows its product, so they stay live
  // either side of the swap and only the identity block is a placeholder.
  const trailing = (
    <WatchlistItemDiscountInfo
      discountInfo={discountInfo}
      hasPinnedStores={hasPinnedStores}
      preferredStores={preferredStores}
      totalStores={totalStores}
      isLoading={isLoading}
      error={error}
    />
  );

  const actions = (
    <div className="flex flex-col items-center gap-2 sm:flex-row-reverse">
      <WatchlistActionButton
        visibilityClassName="shrink-0"
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
  );

  if (isLoading) {
    return <ProductCardSkeleton trailing={trailing} actions={actions} />;
  }

  return (
    <ProductCard
      ean={productApiId}
      name={productName}
      brand={productBrand}
      category={category}
      quantity={quantityWithUnit}
      onNavigate={() => primeProductNavigation(productApiId, product)}
      trailing={trailing}
      actions={actions}
    />
  );
}
