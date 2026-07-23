import { useState, MouseEvent } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { watchlistService, WatchType } from "@/lib/api";
import {
  extractPinnedStoreChainCodes,
  isWatchThresholdReached,
  IWatchlistItemWithProduct,
} from "@/app/(user)/watchlist/utils/watchlist-utils";
import { useUser } from "@/context/user-context";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import { formatQuantity } from "@/utils/strings";

export function useWatchlistItem(item: IWatchlistItemWithProduct) {
  const { watchlistItems, productApiId, product, discountInfo, isLoading } =
    item;
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleRemove() {
    setIsRemoving(true);

    try {
      const removeResults = await Promise.allSettled(
        watchlistItems.map((watchlistItem) =>
          watchlistService.removeFromWatchlist(watchlistItem.id),
        ),
      );

      const failedRemovals = removeResults.filter(
        (result) => result.status === "rejected",
      ).length;

      if (failedRemovals === 0) {
        toast.success("Proizvod uklonjen s popisa za praćenje");
      } else if (failedRemovals === watchlistItems.length) {
        toast.error("Greška pri uklanjanju proizvoda");
      } else {
        toast.error(
          `Djelomično uklanjanje: ${failedRemovals} stavki nije moguće ukloniti.`,
        );
      }
    } catch {
      toast.error("Greška pri uklanjanju proizvoda");
    } finally {
      await queryClient.invalidateQueries({
        queryKey: watchlistService.QUERY_KEYS.all,
      });

      setIsRemoving(false);
    }
  }

  const productName =
    product?.name || (isLoading ? "Učitavanje..." : "Proizvod nije dostupan");
  const productBrand = product?.brand || null;
  const formattedQuantity = formatQuantity(product?.quantity);
  const quantityWithUnit =
    formattedQuantity && product?.unit
      ? `${formattedQuantity}${product.unit}`
      : null;

  const hasPinnedStores =
    extractPinnedStoreChainCodes(user?.pinnedStores).length > 0;

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
    hasPinnedStores,
    isWatchRequirementAchieved,
    handleBadgeClick,
    handleOpenWatchlistModal,
  };
}
