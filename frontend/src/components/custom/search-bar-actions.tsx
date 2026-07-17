"use client";

import { ScanBarcode, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClear}
          title="Clear search"
          aria-label="Clear search"
        >
          <X className="size-5" />
        </Button>
      )}

      {allowScanning && (
        <Button
          type="button"
          variant="default"
          size="icon"
          onClick={onScan}
          title="Scan barcode"
          aria-label="Scan barcode"
        >
          <ScanBarcode className="size-5" />
        </Button>
      )}
    </div>
  );
}
