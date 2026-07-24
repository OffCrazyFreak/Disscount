import { LucideIcon } from "lucide-react";

import StorePriceTooltip from "@/components/custom/price/store-price-tooltip";
import { cn } from "@/lib/utils";
import { priceDeltaColorClass } from "@/utils/price";
import type { INotificationStore } from "@/context/notifications-types";

interface IWatchlistDiscountRowProps {
  icon: LucideIcon;
  difference: number | null;
  text: string;
  stores: INotificationStore[];
  bold?: boolean;
  tooltipSide?: "top" | "right" | "bottom" | "left";
}

export default function WatchlistDiscountRow({
  icon: Icon,
  difference,
  text,
  stores,
  bold = false,
  tooltipSide,
}: IWatchlistDiscountRowProps) {
  const color = priceDeltaColorClass(difference);

  return (
    <div className="flex items-center justify-start gap-2">
      <Icon className={cn("size-4 sm:size-5", color)} />

      <StorePriceTooltip stores={stores} side={tooltipSide}>
        <p
          tabIndex={0}
          className={cn("text-sm", bold ? "font-bold" : "font-medium", color)}
        >
          {text}
        </p>
      </StorePriceTooltip>
    </div>
  );
}
