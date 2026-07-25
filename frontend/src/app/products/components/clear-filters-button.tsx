import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { IUseProductFiltersResult } from "@/app/products/hooks/use-product-filters";

const LABEL = "Očisti filtere";

interface IClearFiltersButtonProps {
  filters: IUseProductFiltersResult;
  /** Renders the label inline, for the widths that have room for it */
  showLabel?: boolean;
  className?: string;
}

/**
 * Always mounted and disabled when idle, so the row never reflows as the last
 * filter goes. A disabled control cannot open a tooltip, which is right here:
 * there is nothing to explain when there is nothing to clear.
 */
export default function ClearFiltersButton({
  filters,
  showLabel = false,
  className,
}: IClearFiltersButtonProps) {
  const disabled = filters.activeFilterCount === 0;

  if (showLabel)
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        className={className}
        onClick={filters.clearFilters}
      >
        <X className="size-4" />
        {LABEL}
      </Button>
    );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={LABEL}
          disabled={disabled}
          className={cn("shrink-0", className)}
          onClick={filters.clearFilters}
        >
          <X className="size-4" />
        </Button>
      </TooltipTrigger>

      <TooltipContent className="px-2 py-1 text-xs">{LABEL}</TooltipContent>
    </Tooltip>
  );
}
