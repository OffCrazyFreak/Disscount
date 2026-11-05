"use client";

import type { ReactElement } from "react";
import { useTranslations } from "next-intl";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import StorePriceList from "@/components/custom/price/store-price-list";
import type { INotificationStore } from "@/context/notifications-types";

interface IStorePriceTooltipProps {
  stores: INotificationStore[];
  emptyLabel?: string;
  side?: "top" | "right" | "bottom" | "left";
  children: ReactElement;
}

export default function StorePriceTooltip({
  stores,
  emptyLabel,
  side,
  children,
}: IStorePriceTooltipProps) {
  const t = useTranslations("products");

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>

      <TooltipContent variant="neutral" side={side} className="px-3 py-2">
        {stores.length > 0 ? (
          <StorePriceList stores={stores} />
        ) : (
          <p className="text-sm">{emptyLabel ?? t("storePrice.empty")}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
