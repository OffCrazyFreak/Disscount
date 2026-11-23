"use client";

import { useLocale, useTranslations } from "next-intl";
import { ShoppingListDto } from "@/lib/api/types";
import { formatDate } from "@/utils/format/strings";
import {
  calculateShoppingListStats,
  countUnpricedItems,
} from "@/features/shopping-lists/utils/shopping-list-utils";
import ShoppingListInfoPriceRange from "@/features/shopping-lists/detail/components/info/shopping-list-info-price-range";
import ShoppingListInfoSpendingRow from "@/features/shopping-lists/detail/components/info/shopping-list-info-spending-row";

interface IShoppingListInfoTableProps {
  shoppingList: ShoppingListDto;
  averagePrices: Record<string, number>;
  isPricesLoading?: boolean;
}

export default function ShoppingListInfoTable({
  shoppingList,
  averagePrices,
  isPricesLoading = false,
}: IShoppingListInfoTableProps) {
  const t = useTranslations("shoppingListDetail");
  const locale = useLocale();

  const {
    minTotal,
    avgTotal,
    maxTotal,
    minToSpend,
    avgToSpend,
    maxToSpend,
    moneySpent,
    catalogSpent,
    checkedCount,
    totalCount,
    savedAmount,
    savedPercentage,
    potentialCostForChecked,
  } = calculateShoppingListStats(shoppingList.items, averagePrices);

  const unpricedCount = countUnpricedItems(shoppingList.items, averagePrices);

  return (
    // One live region for the whole table, so the totals are announced once instead of each skeleton competing.
    <div
      role="status"
      aria-live="polite"
      className="border border-gray-300 rounded-lg overflow-hidden bg-background shadow-2xs"
    >
      <table aria-busy={isPricesLoading} className="w-full text-sm">
        <tbody>
          <tr className="flex flex-col sm:table-row">
            <td className="p-2 whitespace-nowrap border-b sm:border-b-0 sm:border-r">
              <span className="font-bold">{t("info.created")} </span>
              {formatDate(shoppingList.createdAt, locale)}
            </td>
            <td className="p-2">
              <span className="font-bold">{t("info.updated")} </span>
              {formatDate(shoppingList.updatedAt, locale)}
            </td>
          </tr>

          <tr className="flex flex-col sm:table-row border-y">
            <td className="p-2 border-b sm:border-b-0 sm:border-r">
              <span className="font-bold">{t("info.total")} </span>
              <ShoppingListInfoPriceRange
                isLoading={isPricesLoading}
                hasItems={totalCount > 0}
                min={minTotal}
                avg={avgTotal}
                max={maxTotal}
              />
            </td>

            <td className="p-2">
              <span className="font-bold">{t("info.remaining")} </span>
              <ShoppingListInfoPriceRange
                isLoading={isPricesLoading}
                hasItems={totalCount > 0}
                min={minToSpend}
                avg={avgToSpend}
                max={maxToSpend}
              />
            </td>
          </tr>

          {!isPricesLoading && unpricedCount > 0 && (
            <tr className="flex sm:table-row border-b">
              <td colSpan={2} className="p-2 text-muted-foreground">
                {t("info.unpricedItems", { count: unpricedCount })}
              </td>
            </tr>
          )}
          {/* TODO: Make Potrošeno and Ušteđeno/Preplaćeno accessible links to /spending. */}
          <ShoppingListInfoSpendingRow
            checkedCount={checkedCount}
            moneySpent={moneySpent}
            catalogSpent={catalogSpent}
            potentialCostForChecked={potentialCostForChecked}
            savedAmount={savedAmount}
            savedPercentage={savedPercentage}
          />
        </tbody>
      </table>
    </div>
  );
}
