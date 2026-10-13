import { HandCoins } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { INotificationsSummary } from "@/context/notifications-types";
import { formatPrice } from "@/utils/price";

interface INotificationSummaryProps {
  summary: INotificationsSummary;
}

export default function NotificationSummary({
  summary,
}: INotificationSummaryProps) {
  const t = useTranslations("common");
  const locale = useLocale();

  return (
    <div className="px-3 py-2 border-b">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <HandCoins className="size-8 hidden sm:block text-green-700" />

          <div>
            <div className="text-md text-green-700">
              {t("notifications.totalSavings")}
            </div>

            <div className="text-sm text-green-600">
              {t("notifications.savingsDetail", {
                amount: formatPrice(summary.totalSavings, locale),
                count: summary.itemCount,
              })}
            </div>
          </div>
        </div>

        <span className="text-lg font-bold text-green-700">
          {Math.round(summary.totalSavingsPercentage)}%
        </span>
      </div>
    </div>
  );
}
