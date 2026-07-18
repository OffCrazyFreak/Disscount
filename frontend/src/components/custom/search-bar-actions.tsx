"use client";

import { ScanBarcode, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ISearchBarActionsProps {
  showClear: boolean;
  onClear: () => void;
  allowScanning: boolean;
  onScan: () => void;
}

/** Buttons overlaid on the right edge of the search input */
export default function SearchBarActions({
  showClear,
  onClear,
  allowScanning,
  onScan,
}: ISearchBarActionsProps) {
  return (
    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
      {showClear && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClear}
              aria-label="Očisti pretragu"
            >
              <X className="size-5" />
            </Button>
          </TooltipTrigger>

          <TooltipContent className="px-2 py-1 text-xs">
            Očisti pretragu
          </TooltipContent>
        </Tooltip>
      )}

      {allowScanning && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="default"
              size="icon"
              onClick={onScan}
              aria-label="Skeniraj barkod"
            >
              <ScanBarcode className="size-5" />
            </Button>
          </TooltipTrigger>

          <TooltipContent className="px-2 py-1 text-xs">
            Skeniraj barkod
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
