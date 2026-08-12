"use client";

import { ChevronsUpDown, Store, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import StoreChainLogo from "@/components/custom/store-chain/store-chain-logo";
import { cn } from "@/lib/utils";

interface IStoreNameTriggerProps {
  open: boolean;
  storeName: string;
  chainCode: string | null;
  onClear: () => void;
}

export default function StoreNameTrigger({
  open,
  storeName,
  chainCode,
  onClear,
}: IStoreNameTriggerProps) {
  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className={cn(
          "w-full justify-start gap-2 pr-14 font-normal",
          !storeName && "text-muted-foreground",
        )}
      >
        <span className="grid size-5 shrink-0 place-items-center overflow-hidden rounded-sm">
          {chainCode ? (
            <StoreChainLogo chain={chainCode} width={20} height={20} />
          ) : (
            <Store aria-hidden="true" className="size-4 opacity-60" />
          )}
        </span>

        <span className="truncate">{storeName || "Odaberi trgovinu"}</span>
      </Button>

      <div className="absolute inset-y-0 right-2 flex items-center gap-1">
        {storeName && (
          <button
            type="button"
            // Stops the popover from opening: clearing is its own action, not a way in.
            onClick={(event) => {
              event.stopPropagation();
              onClear();
            }}
            aria-label="Očisti trgovinu"
            className="grid size-5 cursor-pointer place-items-center rounded-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <X aria-hidden="true" className="size-3.5" />
          </button>
        )}

        <ChevronsUpDown
          aria-hidden="true"
          className="size-4 shrink-0 opacity-50"
        />
      </div>
    </div>
  );
}
