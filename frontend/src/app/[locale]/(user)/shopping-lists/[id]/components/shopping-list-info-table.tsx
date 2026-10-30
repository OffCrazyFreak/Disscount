"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ShoppingListDto } from "@/lib/api/types";
import { formatDate } from "@/utils/strings";
import { calculateShoppingListStats } from "@/app/[locale]/(user)/shopping-lists/utils/shopping-list-utils";
import ShoppingListInfoPriceRange from "@/app/[locale]/(user)/shopping-lists/[id]/components/shopping-list-info-price-range";
import ShoppingListInfoSpendingRow from "@/app/[locale]/(user)/shopping-lists/[id]/components/shopping-list-info-spending-row";

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
    checkedCount,
    totalCount,
    savedAmount,
    savedPercentage,
    potentialCostForChecked,
  } = useMemo(
    () => calculateShoppingListStats(shoppingList.items, averagePrices),
    [shoppingList.items, averagePrices],
  );

  return (
    // One live region for the whole table, so the totals are announced once when
    // they land rather than each skeleton competing to say nothing.
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
          {/* TODO: Make Potrošeno and Ušteđeno/Preplaćeno accessible links to /spending. */}
          <ShoppingListInfoSpendingRow
            checkedCount={checkedCount}
            moneySpent={moneySpent}
            potentialCostForChecked={potentialCostForChecked}
            savedAmount={savedAmount}
            savedPercentage={savedPercentage}
          />
        </tbody>
      </table>
    </div>
  );
}
