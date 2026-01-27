"use client";

import { useMemo } from "react";
import { ShoppingListDto } from "@/lib/api/types";
import { formatDate } from "@/utils/strings";
import { calculateShoppingListStats } from "@/app/(user)/shopping-lists/utils/shopping-list-utils";
import BlockLoadingSpinner from "@/components/custom/block-loading-spinner";

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
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-background shadow-2xs">
      <table className="w-full text-sm">
        <tbody>
          <tr className="flex flex-col sm:table-row">
            <td className="p-2 whitespace-nowrap border-b sm:border-b-0 sm:border-r">
              <span className="font-bold">Stvoreno: </span>
              {formatDate(shoppingList.createdAt)}
            </td>
            <td className="p-2">
              <span className="font-bold">Ažurirano: </span>
              {formatDate(shoppingList.updatedAt)}
            </td>
          </tr>

          <tr className="flex flex-col sm:table-row border-y">
            <td className="p-2 border-b sm:border-b-0 sm:border-r">
              <span className="font-bold">Ukupno: </span>
              {isPricesLoading ? (
                <BlockLoadingSpinner size={16} />
              ) : totalCount > 0 ? (
                <span className="whitespace-nowrap">
                  <span className="text-green-700">{minTotal.toFixed(2)}€</span>
                  <span className="text-gray-700">
                    {" "}
                    | {avgTotal.toFixed(2)}€ |{" "}
                  </span>
                  <span className="text-red-700">{maxTotal.toFixed(2)}€</span>
                </span>
              ) : (
                "-"
              )}
            </td>

            <td className="p-2">
              <span className="font-bold">Preostalo: </span>
              {isPricesLoading ? (
                <BlockLoadingSpinner size={16} />
              ) : totalCount > 0 ? (
                <span className="whitespace-nowrap">
                  <span className="text-green-700">
                    {minToSpend.toFixed(2)}€
                  </span>
                  <span className="text-gray-700">
                    {" "}
                    | {avgToSpend.toFixed(2)}€ |{" "}
                  </span>
                  <span className="text-red-700">{maxToSpend.toFixed(2)}€</span>
                </span>
              ) : (
                "-"
              )}
            </td>
          </tr>
          <tr className="flex flex-col sm:table-row">
            <td className="p-2 border-b sm:border-b-0 sm:border-r">
              <span className="font-bold">Potrošeno: </span>
              {checkedCount > 0 ? (
                <span className={spentColor}>{moneySpent.toFixed(2)}€</span>
              ) : (
                <span className="text-gray-700">-</span>
              )}
            </td>

            <td className="p-2">
              <span className="font-bold">
                {checkedCount > 0
                  ? savedAmount >= 0
                    ? "Ušteđeno: "
                    : "Preplaćeno: "
                  : "Ušteđeno: "}
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
                  {Math.abs(savedAmount).toFixed(2)}€ (
                  {Math.abs(savedPercentage).toFixed(1)}%)
                </span>
              ) : (
                <span className="text-gray-700">-</span>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
