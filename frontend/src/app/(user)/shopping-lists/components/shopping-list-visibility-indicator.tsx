import { Globe, Lock } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { LinkAccess } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface IShoppingListVisibilityIndicatorProps {
  linkAccess: LinkAccess | null | undefined;
  className?: string;
}

// Deliberately binary: the icon answers "is this shared", not "at what level". Three
// levels cannot be told apart at a glance without teaching three new glyphs, and this is
// a control whose only mode is a glance. The level lives in the tooltip and the
// accessible name, and is set in the share modal. Google Docs draws the same line.
const SHARED_LABELS: Record<LinkAccess, string> = {
  NONE: "Popis je privatan",
  VIEW: "Svatko s poveznicom može vidjeti popis",
  SHOP: "Svatko s poveznicom može označavati stavke",
  EDIT: "Svatko s poveznicom može uređivati popis",
};

export default function ShoppingListVisibilityIndicator({
  linkAccess,
  className,
}: IShoppingListVisibilityIndicatorProps) {
  // Non-owners are sent null on purpose, so they see private rather than a level they
  // cannot change.
  const access = linkAccess ?? "NONE";
  const isShared = access !== "NONE";
  const label = SHARED_LABELS[access];
  const Icon = isShared ? Globe : Lock;

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
