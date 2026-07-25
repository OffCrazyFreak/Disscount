"use client";

import { Clock, ScanBarcode } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ISearchSheetRecentsProps {
  queries: string[];
  onPick: (query: string) => void;
  onClear: () => void;
  onScan: () => void;
}

/** What fills the sheet before anything has been typed */
export default function SearchSheetRecents({
  queries,
  onPick,
  onClear,
  onScan,
}: ISearchSheetRecentsProps) {
  return (
    <div className="flex flex-col gap-4">
      <Button
        type="button"
        variant="secondary"
        size="lg"
        onClick={onScan}
        className="w-full justify-start gap-3"
      >
        <ScanBarcode className="size-5" />
        Skeniraj crtni kod
      </Button>

      {queries.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="text-muted-foreground flex items-center justify-between px-1 text-xs">
            <span>Nedavno traženo</span>

            <button
              type="button"
              onClick={onClear}
              className="hover:text-foreground underline"
            >
              Očisti
            </button>
          </div>

          <ul>
            {queries.map((query) => (
              <li key={query}>
                <button
                  type="button"
                  onClick={() => onPick(query)}
                  className="hover:bg-accent flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left text-sm"
                >
                  <Clock className="text-muted-foreground size-4 shrink-0" />
                  <span className="truncate">{query}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
