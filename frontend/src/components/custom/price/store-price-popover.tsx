"use client";

import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={label}
            title={label}
            className="text-inherit hover:text-inherit focus-visible:text-inherit"
          >
            <Info className="size-6 sm:size-7" aria-hidden="true" />
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-auto max-w-72 px-3 py-2">
          <StorePriceList stores={stores} />
        </PopoverContent>
      </Popover>
    </span>
  );
}
