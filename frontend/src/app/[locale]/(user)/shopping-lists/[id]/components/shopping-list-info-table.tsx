"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ShoppingListDto } from "@/lib/api/types";
import { formatDate } from "@/utils/strings";
import { formatPrice } from "@/utils/price";
import { calculateShoppingListStats } from "@/app/[locale]/(user)/shopping-lists/utils/shopping-list-utils";
import ShoppingListPriceRangeSkeleton from "@/app/[locale]/(user)/shopping-lists/[id]/components/shopping-list-price-range-skeleton";

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

  function priceRange(min: number, avg: number, max: number) {
    return t.rich("info.priceRange", {
      min: formatPrice(min, locale),
      avg: formatPrice(avg, locale),
      max: formatPrice(max, locale),
      low: (chunks) => <span className="text-green-700">{chunks}</span>,
      mid: (chunks) => <span className="text-gray-700">{chunks}</span>,
      high: (chunks) => <span className="text-red-700">{chunks}</span>,
    });
  }

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

  // Determine color for moneySpent based on comparison to average
  const spentColor = useMemo(() => {
    if (potentialCostForChecked === 0) return "text-gray-700";
    if (moneySpent < potentialCostForChecked) return "text-green-700";
    if (moneySpent > potentialCostForChecked) return "text-red-700";
    return "text-gray-700"; // exactly average
  }, [moneySpent, potentialCostForChecked]);

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
              {isPricesLoading ? (
                <ShoppingListPriceRangeSkeleton />
              ) : totalCount > 0 ? (
                <span className="whitespace-nowrap">
                  {priceRange(minTotal, avgTotal, maxTotal)}
                </span>
              ) : (
                t("emptyValue")
              )}
            </td>

            <td className="p-2">
              <span className="font-bold">{t("info.remaining")} </span>
              {isPricesLoading ? (
                <ShoppingListPriceRangeSkeleton />
              ) : totalCount > 0 ? (
                <span className="whitespace-nowrap">
                  {priceRange(minToSpend, avgToSpend, maxToSpend)}
                </span>
              ) : (
                t("emptyValue")
              )}
            </td>
          </tr>
          {/* TODO: Make Potrošeno and Ušteđeno/Preplaćeno accessible links to /spending. */}
          <tr className="flex flex-col sm:table-row">
            <td className="p-2 border-b sm:border-b-0 sm:border-r">
              <span className="font-bold">{t("info.spent")} </span>
              {checkedCount > 0 ? (
                <span className={spentColor}>
                  {formatPrice(moneySpent, locale)}
                </span>
              ) : (
                <span className="text-gray-700">{t("emptyValue")}</span>
              )}
            </td>

            <td className="p-2">
              <span className="font-bold">
                {checkedCount > 0
                  ? savedAmount >= 0
                    ? t("info.saved")
                    : t("info.overpaid")
                  : t("info.saved")}{" "}
              </span>
              {checkedCount > 0 ? (
                <span
                  className={
                    savedAmount > 0
                      ? "text-green-700"
                      : savedAmount < 0
                        ? "text-red-700"
                        : "text-gray-700"
                  }
                >
                  {t("info.savings", {
                    amount: formatPrice(Math.abs(savedAmount), locale),
                    percent: Math.round(Math.abs(savedPercentage)),
                  })}
                </span>
              ) : (
                <span className="text-gray-700">{t("emptyValue")}</span>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
