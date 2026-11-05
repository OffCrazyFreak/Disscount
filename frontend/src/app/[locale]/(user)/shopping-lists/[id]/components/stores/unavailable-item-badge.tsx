import { useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface IUnavailableItemBadgeProps {
  isMobile: boolean;
}

export default function UnavailableItemBadge({
  isMobile,
}: IUnavailableItemBadgeProps) {
  const t = useTranslations("shoppingListDetail");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {isMobile ? (
          <TriangleAlert className="size-4 shrink-0 text-amber-600 inline ml-2" />
        ) : (
          <Badge variant="warningSoft">
            <TriangleAlert className="size-4 shrink-0" />
            {t("stores.table.unavailable")}
          </Badge>
        )}
      </TooltipTrigger>

      <TooltipContent variant="warningSoft" className="px-2 py-1 text-xs">
        {t("stores.table.unavailableTooltip")}
      </TooltipContent>
    </Tooltip>
  );
}
