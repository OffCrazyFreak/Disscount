import { Globe, Lock } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface IShoppingListVisibilityIndicatorProps {
  isPublic: boolean;
  className?: string;
}

export default function ShoppingListVisibilityIndicator({
  isPublic,
  className,
}: IShoppingListVisibilityIndicatorProps) {
  const label = isPublic ? "Popis je javan" : "Popis je privatan";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn("inline-flex shrink-0", className)}
          tabIndex={0}
          role="img"
          aria-label={label}
        >
          {isPublic ? (
            <Globe className="size-6 text-primary" aria-hidden="true" />
          ) : (
            <Lock className="size-6 text-muted-foreground" aria-hidden="true" />
          )}
        </span>
      </TooltipTrigger>

      <TooltipContent className="px-2 py-1 text-xs">{label}</TooltipContent>
    </Tooltip>
  );
}
