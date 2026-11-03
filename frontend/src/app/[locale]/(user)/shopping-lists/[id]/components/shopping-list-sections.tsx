"use client";

import { type ComponentProps } from "react";
import { useTranslations } from "next-intl";
import JumpSection from "@/components/custom/common/jump-section";
import SectionJumpNav from "@/components/custom/common/section-jump-nav";
import ShoppingListItems from "@/app/[locale]/(user)/shopping-lists/[id]/components/items/shopping-list-items";
import ShoppingListPriceHistory from "@/app/[locale]/(user)/shopping-lists/[id]/components/shopping-list-price-history";
import ShoppingListStoreSummary from "@/app/[locale]/(user)/shopping-lists/[id]/components/stores/shopping-list-stores-list";
import { useListChainAggregates } from "@/app/[locale]/(user)/shopping-lists/[id]/hooks/use-list-chain-aggregates";
import type { ISectionJumpNavItem } from "@/typings/section-jump-nav";

type IShoppingListSectionsProps = ComponentProps<typeof ShoppingListItems>;

/** The list's products, stores and price history, under one sticky jump bar. */
export default function ShoppingListSections(
  itemsProps: IShoppingListSectionsProps,
) {
  const t = useTranslations("shoppingListDetail.sectionNav");
  const tSections = useTranslations("common.sectionNav");
  const { shoppingList, priceStates } = itemsProps;
  const { allChains } = useListChainAggregates(shoppingList);
  // An empty list has no history to chart.
  const hasItems = shoppingList.items.length > 0;

  const sections: ISectionJumpNavItem[] = [
    {
      id: "products",
      label: t("products"),
      count: shoppingList.items.length,
    },
    {
      id: "stores",
      label: tSections("stores"),
      shortLabel: tSections("storesShort"),
      count: allChains.length,
    },
  ];

  if (hasItems) {
    sections.push({
      id: "price-history",
      label: tSections("priceHistory"),
      shortLabel: tSections("priceHistoryShort"),
    });
  }

  return (
    <>
      <SectionJumpNav label={t("label")} sections={sections} />

      <JumpSection id="products">
        <ShoppingListItems {...itemsProps} />
      </JumpSection>

      <JumpSection id="stores">
        <ShoppingListStoreSummary
          shoppingList={shoppingList}
          hasFailedPrices={Object.values(priceStates).includes("failed")}
        />
      </JumpSection>

      {hasItems && (
        <JumpSection id="price-history">
          <ShoppingListPriceHistory shoppingList={shoppingList} />
        </JumpSection>
      )}
    </>
  );
}
