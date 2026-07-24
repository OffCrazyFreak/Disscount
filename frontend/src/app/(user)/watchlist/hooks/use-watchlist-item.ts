import { MouseEvent } from "react";

import { WatchType } from "@/lib/api";
import {
  extractPinnedStoreChainCodes,
  getScopedDiscountedStores,
  isWatchThresholdReached,
  IWatchlistItemWithProduct,
} from "@/app/(user)/watchlist/utils/watchlist-utils";
import { getMostFrequentCategory } from "@/app/products/utils/product-utils";
import useWatchlistRemoval from "@/app/(user)/watchlist/hooks/use-watchlist-removal";
import { useUser } from "@/context/user-context";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import { formatQuantity } from "@/utils/strings";

export function useWatchlistItem(item: IWatchlistItemWithProduct) {
  const { watchlistItems, productApiId, product, discountInfo, isLoading } =
    item;
  const { user } = useUser();

  const { isRemoving, handleRemove } = useWatchlistRemoval(watchlistItems);

  const productName =
    product?.name || (isLoading ? "Učitavanje..." : "Proizvod nije dostupan");
  const productBrand = product?.brand || null;
  const formattedQuantity = formatQuantity(product?.quantity);
  const quantityWithUnit =
    formattedQuantity && product?.unit
      ? `${formattedQuantity}${product.unit}`
      : null;

  const pinnedStoreChainCodes = extractPinnedStoreChainCodes(
    user?.pinnedStores,
  );
  const hasPinnedStores = pinnedStoreChainCodes.length > 0;

  const category = product ? getMostFrequentCategory(product) : null;

  const preferredStores = product
    ? getScopedDiscountedStores(product, pinnedStoreChainCodes, true)
    : [];

  const totalStores = product
    ? getScopedDiscountedStores(product, [], false)
    : [];

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

  function openWatchlistModal(watchType: WatchType) {
    openModalUrl({
      name: "watchlist",
      ean: productApiId,
      watchType: watchType === WatchType.absolute ? "absolute" : "percentage",
    });
  }

  function handleBadgeClick(
    event: MouseEvent<HTMLButtonElement>,
    watchType: WatchType,
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (!product) {
      return;
    }

    openWatchlistModal(watchType);
  }

  function handleOpenWatchlistModal() {
    if (!product) {
      return;
    }

    openWatchlistModal(WatchType.percentage);
  }

  return {
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
  };
}
