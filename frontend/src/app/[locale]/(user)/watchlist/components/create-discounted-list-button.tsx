"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import ResponsiveLabel from "@/components/custom/common/responsive-label";
import { shoppingListService } from "@/lib/api";
import { IWatchlistItemWithProduct } from "@/app/[locale]/(user)/watchlist/utils/watchlist-utils";
import { formatDate } from "@/utils/strings";

interface ICreateDiscountedListButtonProps {
  discountedItems: IWatchlistItemWithProduct[];
  /** Prices are still resolving, so the discounted set is not final yet */
  isLoading?: boolean;
}

export default function CreateDiscountedListButton({
  discountedItems,
  isLoading = false,
}: ICreateDiscountedListButtonProps) {
  const t = useTranslations("watchlist");
  const locale = useLocale();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const addableProducts = discountedItems
    .filter((item) => item.product)
    .map((item) => item.product!);

  const actionLabel = t("createList.label");
  const buttonText = actionLabel;
  const isDisabled = isCreating || isLoading || addableProducts.length === 0;

  async function handleCreateDiscountedList() {
    if (isDisabled) {
      return;
    }

    try {
      setIsCreating(true);

      const today = formatDate(new Date().toISOString(), locale);

      const createdList = await shoppingListService.createShoppingList({
        title: t("createList.listTitle", { date: today }),
      });

      const createItemResults = await Promise.allSettled(
        addableProducts.map((product) =>
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

          toast.error(t("createList.addFailedRemoved"));
        } catch {
          toast.error(t("createList.addFailedKept"));

          router.push(`/shopping-lists/${createdList.id}`);
        }

        return;
      }

      toast.success(t("createList.success"));
      router.push(`/shopping-lists/${createdList.id}`);
    } catch {
      toast.error(t("createList.createError"));
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
        loadingText={t("createList.loading")}
      >
        <ResponsiveLabel full={buttonText} short={t("createList.short")} />

        {/* Visual only: inside the label it would leave the visible text outside
            the accessible name, and re-announce on every change. The margin is
            explicit because expandIcon zeroes the button's gap, so the count
            would otherwise sit flush against the label. */}
        <span aria-hidden="true" className="ml-1">
          {`(${addableProducts.length})`}
        </span>
      </Button>

      {/* The count is hidden from the button's own name so it does not re-announce the
          whole control on every change. It still has to be announced somehow, so it is
          mirrored here, outside the button, where a polite region can carry it alone. */}
      <span aria-live="polite" className="sr-only">
        {t("createList.productCount", { count: addableProducts.length })}
      </span>
    </>
  );
}
