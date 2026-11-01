import { useTranslations } from "next-intl";

import { Skeleton } from "@/components/ui/skeleton";
import StoreChainSelect from "@/components/custom/store-chain/store-chain-select";
import type { ShoppingListItemDto } from "@/lib/api/types";
import { getChainLabel } from "@/utils/labels";
import UnavailableStoreSelect from "@/app/[locale]/(user)/shopping-lists/[id]/components/items/unavailable-store-select";
import {
  PRICE_STATUS_BANNER_ID,
  UNAVAILABLE_PRICE_KEYS,
  type ItemPriceState,
} from "@/app/[locale]/(user)/shopping-lists/[id]/utils/item-price-state";
import type { IShoppingListItemUpdate } from "@/app/[locale]/(user)/shopping-lists/[id]/typings/shopping-list-item-types";
import { SHARED_ACCESS_BANNER_ID } from "@/app/[locale]/(user)/shopping-lists/utils/shopping-list-access";

interface IItemStoreSelectProps {
  item: ShoppingListItemDto;
  onUpdate: (updatedItem: IShoppingListItemUpdate) => void;
  priceState: ItemPriceState;
  cheapestStore?: string;
  averagePrice?: number;
  storePrices: Record<string, number>;
  canCheck: boolean;
}

const STORE_SELECT_CLASS_NAME = "relative z-20 w-full sm:w-72 sm:flex-none";

/** The item's store choice, or what stands in for it until there are live prices to choose from. */
export default function ItemStoreSelect({
  item,
  onUpdate,
  priceState,
  cheapestStore,
  averagePrice,
  storePrices,
  canCheck,
}: IItemStoreSelectProps) {
  const t = useTranslations("shoppingListDetail");

  if (priceState === "ready") {
    return (
      <StoreChainSelect
        value={item.chainCode}
        onChange={(chainCode) =>
          onUpdate({
            isChecked: item.isChecked,
            amount: item.amount || 1,
            chainCode,
          })
        }
        disabled={item.isChecked || !canCheck}
        describedById={canCheck ? undefined : SHARED_ACCESS_BANNER_ID}
        defaultValue={cheapestStore}
        storePrices={storePrices}
        averagePrice={averagePrice}
        isChecked={item.isChecked}
        storePriceFromDb={item.storePrice || undefined}
        className={STORE_SELECT_CLASS_NAME}
      />
    );
  }

  const reasonKey = UNAVAILABLE_PRICE_KEYS[priceState];
  if (!reasonKey) {
    return (
      <Skeleton
        aria-hidden="true"
        className={`h-10 motion-reduce:animate-none ${STORE_SELECT_CLASS_NAME}`}
      />
    );
  }

  // Viewers get the access banner too, but the price reason still applies to them.
  const describedById =
    [
      !canCheck && SHARED_ACCESS_BANNER_ID,
      priceState === "failed" && PRICE_STATUS_BANNER_ID,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  const reason = t(reasonKey);

  return (
    <UnavailableStoreSelect
      label={
        item.chainCode
          ? t("prices.withStore", {
              store: getChainLabel(item.chainCode),
              reason,
            })
          : reason
      }
      reason={reason}
      describedById={describedById}
      isReasonDescribed={priceState !== "failed"}
      className={STORE_SELECT_CLASS_NAME}
    />
  );
}
