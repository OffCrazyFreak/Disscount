import { useLocale, useTranslations } from "next-intl";

import { formatPrice } from "@/utils/price";
import {
  savedTone,
  spentTone,
} from "@/app/[locale]/(user)/shopping-lists/[id]/utils/info-table-tones";

interface IShoppingListInfoSpendingRowProps {
  checkedCount: number;
  moneySpent: number;
  potentialCostForChecked: number;
  savedAmount: number;
  savedPercentage: number;
}

export default function ShoppingListInfoSpendingRow({
  checkedCount,
  moneySpent,
  potentialCostForChecked,
  savedAmount,
  savedPercentage,
}: IShoppingListInfoSpendingRowProps) {
  const t = useTranslations("shoppingListDetail");
  const locale = useLocale();
  const hasChecked = checkedCount > 0;
  const empty = <span className="text-gray-700">{t("emptyValue")}</span>;

  return (
    <tr className="flex flex-col sm:table-row">
      <td className="p-2 border-b sm:border-b-0 sm:border-r">
        <span className="font-bold">{t("info.spent")} </span>
        {hasChecked ? (
          <span className={spentTone(moneySpent, potentialCostForChecked)}>
            {formatPrice(moneySpent, locale)}
          </span>
        ) : (
          empty
        )}
      </td>

      <td className="p-2">
        <span className="font-bold">
          {hasChecked && savedAmount < 0
            ? t("info.overpaid")
            : t("info.saved")}{" "}
        </span>
        {hasChecked ? (
          <span className={savedTone(savedAmount)}>
            {t("info.savings", {
              amount: formatPrice(Math.abs(savedAmount), locale),
              percent: Math.round(Math.abs(savedPercentage)),
            })}
          </span>
        ) : (
          empty
        )}
      </td>
    </tr>
  );
}
