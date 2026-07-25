"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ISearchSheetClearFiltersProps {
  disabled: boolean;
  onClear: () => void;
}

/**
 * Stays mounted and disabled with nothing to clear, rather than unmounting:
 * removing it reflowed the row every time the last filter went. A disabled
 * control shows no tooltip at all, which is fine here, since it is disabled
 * exactly when there is nothing left to explain.
 */
export default function SearchSheetClearFilters({
  disabled,
  onClear,
}: ISearchSheetClearFiltersProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label="Očisti filtere"
          disabled={disabled}
          className="shrink-0"
          onClick={onClear}
        >
          <X className="size-4" />
          <span className="hidden md:inline">Očisti filtere</span>
        </Button>
      </TooltipTrigger>

      <TooltipContent className="px-2 py-1 text-xs">
        Očisti filtere
      </TooltipContent>
    </Tooltip>
  );
}
