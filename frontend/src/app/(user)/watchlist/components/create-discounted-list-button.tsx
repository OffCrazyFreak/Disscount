"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageFab from "@/components/custom/fab/page-fab";
import { shoppingListService } from "@/lib/api";
import { WatchlistItemWithProduct } from "@/app/(user)/watchlist/utils/watchlist-utils";
import { formatDate } from "@/utils/strings";

interface ICreateDiscountedListButtonProps {
  discountedItems: WatchlistItemWithProduct[];
  /** Prices are still resolving, so the discounted set is not final yet */
  isLoading?: boolean;
}

export default function CreateDiscountedListButton({
  discountedItems,
  isLoading = false,
}: ICreateDiscountedListButtonProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  // The count belongs in the visible text only: as an accessible name it would
  // re-announce the button every time a price moves.
  const actionLabel = "Stvori popis sniženih proizvoda";
  const buttonText = `${actionLabel} (${discountedItems.length})`;
  const isDisabled = isCreating || isLoading || discountedItems.length === 0;

  async function handleCreateDiscountedList() {
    if (isDisabled) {
      return;
    }

    try {
      setIsCreating(true);

      const today = formatDate(new Date().toISOString());

      const createdList = await shoppingListService.createShoppingList({
        title: `Sniženo ${today}`,
        isPublic: false,
      });

      const itemsToAdd = discountedItems
        .filter((item) => item.product)
        .map((item) => item.product!);

      const createItemResults = await Promise.allSettled(
        itemsToAdd.map((product) =>
          shoppingListService.addItemToShoppingList(createdList.id, {
            ean: product.ean,
            name: product.name || product.ean,
            brand: product.brand || null,
            quantity: product.quantity || null,
            unit: product.unit || null,
            amount: 1,
            isChecked: false,
            chainCode: null,
            avgPrice: null,
            storePrice: null,
          }),
        ),
      );

      const failedAdds = createItemResults.filter(
        (result) => result.status === "rejected",
      );

      if (failedAdds.length > 0) {
        try {
          await shoppingListService.deleteShoppingList(createdList.id);

          toast.error(
            "Neke stavke nije bilo moguće dodati. Popis je automatski uklonjen.",
          );
        } catch {
          toast.error(
            "Neke stavke nije bilo moguće dodati, a popis nije moguće automatski ukloniti.",
          );

          router.push(`/shopping-lists/${createdList.id}`);
        }

        return;
      }

      toast.success("Popis sniženih proizvoda je uspješno kreiran");
      router.push(`/shopping-lists/${createdList.id}`);
    } catch {
      toast.error("Greška pri kreiranju popisa sniženih proizvoda");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        effect="expandIcon"
        onClick={handleCreateDiscountedList}
        icon={Sparkles}
        iconPlacement="left"
        disabled={isDisabled}
        loading={isCreating}
        loadingText="Stvaranje popisa..."
        className="hidden sm:inline-flex"
      >
        {buttonText}
      </Button>

      <PageFab
        primary={{
          icon: Sparkles,
          label: actionLabel,
          onClick: handleCreateDiscountedList,
          disabled: isDisabled,
          loading: isCreating,
        }}
      />
    </>
  );
}
