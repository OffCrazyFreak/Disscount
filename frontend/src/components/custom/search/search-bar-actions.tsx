"use client";

import { ScanBarcode, X } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("shell");

  return (
    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
      {showClear && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 [&_svg]:size-5"
              onClick={onClear}
              aria-label={t("search.clear")}
            >
              <X aria-hidden="true" />
            </Button>
          </TooltipTrigger>

          <TooltipContent className="px-2 py-1 text-xs">
            {t("search.clear")}
          </TooltipContent>
        </Tooltip>
      )}

      {allowScanning && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="primary"
              size="icon"
              className="size-8 [&_svg]:size-5"
              onClick={onScan}
              aria-label={t("search.scanBarcode")}
            >
              <ScanBarcode aria-hidden="true" />
            </Button>
          </TooltipTrigger>

          <TooltipContent className="px-2 py-1 text-xs">
            {t("search.scanBarcode")}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
