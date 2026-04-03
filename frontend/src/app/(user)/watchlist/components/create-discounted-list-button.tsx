"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Loader2, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingActionButton } from "@/components/custom/floating-action-button";
import { shoppingListService } from "@/lib/api";
import { WatchlistItemWithProduct } from "@/app/(user)/watchlist/utils/watchlist-utils";
import { formatDate } from "@/utils/strings";

interface CreateDiscountedListButtonProps {
  discountedItems: WatchlistItemWithProduct[];
}

export default function CreateDiscountedListButton({
  discountedItems,
}: CreateDiscountedListButtonProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreateDiscountedList() {
    if (isCreating || discountedItems.length === 0) {
      return;
    }

    try {
      setIsCreating(true);

      const today = formatDate(new Date().toISOString());

      const createdList = await shoppingListService.createShoppingList({
        title: `Sniženo ${today}`,
        isPublic: false,
      });

      const createItemPromises = discountedItems
        .filter((item) => item.product)
        .map((item) => {
          const product = item.product!;

          return shoppingListService.addItemToShoppingList(createdList.id, {
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
          });
        });

      await Promise.all(createItemPromises);

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
        disabled={isCreating || discountedItems.length === 0}
        loading={isCreating}
        loadingText="Stvaranje popisa..."
        className="hidden sm:inline-flex"
      >
        Stvori popis sniženih proizvoda ({discountedItems.length})
      </Button>

      <FloatingActionButton
        onClick={handleCreateDiscountedList}
        icon={
          isCreating ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <Sparkles size={24} />
          )
        }
        label="Stvori popis sniženih proizvoda"
        className="sm:hidden"
        disabled={isCreating || discountedItems.length === 0}
      />
    </>
  );
}
