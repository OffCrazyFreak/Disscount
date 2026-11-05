"use client";

import { type ComponentProps } from "react";
import { useTranslations } from "next-intl";
import SectionTabs from "@/components/custom/common/section-tabs";
import ShoppingListItems from "@/app/[locale]/(user)/shopping-lists/[id]/components/items/shopping-list-items";
import ShoppingListPriceHistory from "@/app/[locale]/(user)/shopping-lists/[id]/components/shopping-list-price-history";
import ShoppingListStoreSummary from "@/app/[locale]/(user)/shopping-lists/[id]/components/stores/shopping-list-stores-list";
import { useListChainAggregates } from "@/app/[locale]/(user)/shopping-lists/[id]/hooks/use-list-chain-aggregates";
import type { ISectionTab } from "@/typings/section-tabs";

type IShoppingListSectionsProps = ComponentProps<typeof ShoppingListItems>;

/** The list's products, stores and price history, as tabs under one sticky bar. */
export default function ShoppingListSections(
  itemsProps: IShoppingListSectionsProps,
) {
  const t = useTranslations("shoppingListDetail.sectionNav");
  const tSections = useTranslations("common.sectionNav");
  const tItems = useTranslations("shoppingListDetail");
  const { shoppingList, priceStates } = itemsProps;
  const { allChains } = useListChainAggregates(shoppingList);
  // An empty list has no stores to compare and no history to chart.
  const hasItems = shoppingList.items.length > 0;

  const total = shoppingList.items.length;
  const checked = shoppingList.items.filter((item) => item.isChecked).length;

  const tabs: ISectionTab[] = [
    {
      id: "products",
      label: t("products"),
      // Once something is checked the badge reads "2/5", and says so aloud.
      count: checked > 0 ? checked : total,
      total: checked > 0 ? total : undefined,
      accessibleName:
        checked > 0
          ? tItems("items.titleWithChecked", {
              label: t("products"),
              checked,
              total,
            })
          : undefined,
      content: <ShoppingListItems {...itemsProps} />,
    },
  ];

  if (hasItems) {
    tabs.push(
      {
        id: "stores",
        label: tSections("stores"),
        shortLabel: tSections("storesShort"),
        count: allChains.length,
        content: (
          <ShoppingListStoreSummary
            shoppingList={shoppingList}
            hasFailedPrices={Object.values(priceStates).includes("failed")}
          />
        ),
      },
      {
        id: "price-history",
        label: tSections("priceHistory"),
        shortLabel: tSections("priceHistoryShort"),
        content: <ShoppingListPriceHistory shoppingList={shoppingList} />,
      },
    );
  }

  return <SectionTabs label={t("label")} tabs={tabs} />;
}
