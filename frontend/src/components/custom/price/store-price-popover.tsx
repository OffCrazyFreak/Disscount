"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import PriceInfoButton from "@/components/custom/price/price-info-button";
import StorePriceList from "@/components/custom/price/store-price-list";
import type { INotificationStore } from "@/context/notifications-types";
import { cn } from "@/lib/utils";

interface IStorePricePopoverProps {
  stores: INotificationStore[];
  label: string;
  className?: string;
}

export default function StorePricePopover({
  stores,
  label,
  className,
}: IStorePricePopoverProps) {
  return (
    <span className={cn("relative z-20 inline-flex", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <PriceInfoButton
            label={label}
            title={label}
            className="text-inherit hover:text-inherit focus-visible:text-inherit"
          />
        </PopoverTrigger>

        <PopoverContent align="end" className="w-auto max-w-72 px-3 py-2">
          <StorePriceList stores={stores} />
        </PopoverContent>
      </Popover>
    </span>
  );
}
