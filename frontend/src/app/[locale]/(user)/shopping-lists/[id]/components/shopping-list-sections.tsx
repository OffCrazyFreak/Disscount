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

// One source for each id, which the nav links to and the URL hash names.
const SECTION_IDS = {
  products: "products",
  stores: "stores",
  priceHistory: "price-history",
};

type IShoppingListSectionsProps = ComponentProps<typeof ShoppingListItems>;

/** The list's products, stores and price history, under one sticky jump bar. */
export default function ShoppingListSections(
  itemsProps: IShoppingListSectionsProps,
) {
  const t = useTranslations("shoppingListDetail.sectionNav");
  const tSections = useTranslations("common.sectionNav");
  const { shoppingList, priceStates } = itemsProps;
  const { allChains } = useListChainAggregates(shoppingList);
  // An empty list has no stores to compare and no history to chart.
  const hasItems = shoppingList.items.length > 0;

  const sections: ISectionJumpNavItem[] = [
    {
      id: SECTION_IDS.products,
      label: t("products"),
      count: shoppingList.items.length,
    },
  ];

  if (hasItems) {
    sections.push(
      {
        id: SECTION_IDS.stores,
        label: tSections("stores"),
        shortLabel: tSections("storesShort"),
        count: allChains.length,
      },
      {
        id: SECTION_IDS.priceHistory,
        label: tSections("priceHistory"),
        shortLabel: tSections("priceHistoryShort"),
      },
    );
  }

  return (
    <>
      <SectionJumpNav label={t("label")} sections={sections} />

      <JumpSection id={SECTION_IDS.products}>
        <ShoppingListItems {...itemsProps} />
      </JumpSection>

      {hasItems && (
        <>
          <JumpSection id={SECTION_IDS.stores}>
            <ShoppingListStoreSummary
              shoppingList={shoppingList}
              hasFailedPrices={Object.values(priceStates).includes("failed")}
            />
          </JumpSection>

          <JumpSection id={SECTION_IDS.priceHistory}>
            <ShoppingListPriceHistory shoppingList={shoppingList} />
          </JumpSection>
        </>
      )}
    </>
  );
}
