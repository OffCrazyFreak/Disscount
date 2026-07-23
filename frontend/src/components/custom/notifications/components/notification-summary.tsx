import { HandCoins } from "lucide-react";
import type { INotificationsSummary } from "@/context/notifications-types";

interface INotificationSummaryProps {
  summary: INotificationsSummary;
}

export default function NotificationSummary({
  summary,
}: INotificationSummaryProps) {
  return (
    <div className="px-3 py-2 border-b">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <HandCoins className="size-8 hidden sm:block text-green-700" />

          <div>
            <div className="text-md text-green-700">Ukupna ušteda danas:</div>

            <div className="text-sm text-green-600">
              (≥ {summary.totalSavings.toFixed(2)}€ na {summary.itemCount}{" "}
              {summary.itemCount === 1 ? "proizvod" : "proizvoda"})
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
