import { useTranslations } from "next-intl";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { LinkAccess } from "@/lib/api/types";
import { LINK_ACCESS_ICONS } from "@/app/[locale]/(user)/shopping-lists/utils/link-access-icons";
import { cn } from "@/lib/utils";

interface IShoppingListVisibilityIndicatorProps {
  linkAccess: LinkAccess | null | undefined;
  className?: string;
}

// One glyph per level, the same map the share modal and the shared-list banner use, so a
// list shows the same picture wherever you meet it. This was binary Lock and Globe at
// first, on the reasoning that a glance only needs to answer "is this shared"; carrying
// the level costs nothing once the glyphs are already taught elsewhere, and the tooltip
// still spells it out.
const SHARED_LABEL_KEYS = {
  NONE: "visibility.NONE",
  VIEW: "visibility.VIEW",
  SHOP: "visibility.SHOP",
  EDIT: "visibility.EDIT",
} as const satisfies Record<LinkAccess, string>;

export default function ShoppingListVisibilityIndicator({
  linkAccess,
  className,
}: IShoppingListVisibilityIndicatorProps) {
  const t = useTranslations("shoppingLists");
  // Non-owners are sent null on purpose, so they see private rather than a level they
  // cannot change.
  const access = linkAccess ?? "NONE";
  const isShared = access !== "NONE";
  const label = t(SHARED_LABEL_KEYS[access]);
  const Icon = LINK_ACCESS_ICONS[access];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* Focusable so the tooltip is reachable without a pointer: hover-only would
            hide the level from keyboard and touch users entirely. */}
        <span
          className={cn(
            "inline-flex shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
          tabIndex={0}
          role="img"
          aria-label={label}
        >
          <Icon
            className={cn(
              "size-6",
              isShared ? "text-primary" : "text-muted-foreground",
            )}
            aria-hidden="true"
          />
        </span>
      </TooltipTrigger>

      <TooltipContent className="px-2 py-1 text-xs">{label}</TooltipContent>
    </Tooltip>
  );
}
