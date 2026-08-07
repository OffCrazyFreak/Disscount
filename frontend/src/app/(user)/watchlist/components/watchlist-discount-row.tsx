import { LucideIcon } from "lucide-react";

import StorePricePopover from "@/components/custom/price/store-price-popover";
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
  infoLabel: string;
  onOpenPreferences: () => void;
}

export default function WatchlistDiscountRow({
  icon: Icon,
  difference,
  text,
  stores,
  bold = false,
  tooltipSide,
  infoLabel,
  onOpenPreferences,
}: IWatchlistDiscountRowProps) {
  const color = priceDeltaColorClass(difference);

  // No row wrapper of its own: PriceStack lays the tier out, so the row cannot
  // drift from the product card's spacing.
  return (
    <>
      <StorePriceTooltip stores={stores} side={tooltipSide}>
        <button
          type="button"
          onClick={onOpenPreferences}
          className={cn(
            "relative z-20 flex cursor-pointer items-center gap-2 rounded-sm text-sm transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            bold ? "font-bold" : "font-medium",
            color,
          )}
        >
          <Icon className="size-6" aria-hidden="true" />
          <span>{text}</span>
          {/* The price is the visible label, so it has to lead the accessible
              name: an aria-label replaced it outright, which hid the figure from
              screen readers and left voice control unable to say it. infoLabel
              also tells the two rows on a card apart. */}
          <span className="sr-only">
            , {infoLabel}, otvori preference trgovina
          </span>
        </button>
      </StorePriceTooltip>

      {stores.length > 0 && (
        <StorePricePopover
          stores={stores}
          label={infoLabel}
          className={color}
        />
      )}
    </>
  );
}
