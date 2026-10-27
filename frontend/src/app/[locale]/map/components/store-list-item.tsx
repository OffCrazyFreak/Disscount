"use client";

import { ChevronDown } from "lucide-react";
import { useId } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import StoreDetails from "@/app/[locale]/map/components/store-details";
import StoreSummary, {
  summaryLabelIds,
} from "@/app/[locale]/map/components/store-summary";
import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";
import { cn } from "@/lib/utils";

interface IStoreListItemProps {
  row: IListedStore;
  isSelected: boolean;
  /** Null closes the store. */
  onSelect: (key: string | null) => void;
}

/** A store that opens in place; the open one is the store selected on the map. */
export default function StoreListItem({
  row,
  isSelected,
  onSelect,
}: IStoreListItemProps) {
  const id = useId();

  return (
    <Collapsible
      open={isSelected}
      onOpenChange={(open) => onSelect(open ? row.key : null)}
      className={cn("rounded-lg", isSelected && "bg-primary/10")}
    >
      {/* The trigger covers the row instead of wrapping it, so the share pill
          can sit in the address line without nesting a button in a button. */}
      <div className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/70">
        <CollapsibleTrigger
          data-store-key={row.key}
          aria-labelledby={summaryLabelIds(row, id)}
          className="absolute inset-0 z-1 rounded-lg focus-visible:outline-2 focus-visible:outline-primary"
        />

        <StoreSummary row={row} isOpen={isSelected} id={id} />

        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none",
            isSelected && "rotate-180",
          )}
          aria-hidden="true"
        />
      </div>

      <CollapsibleContent className="my-0">
        <StoreDetails row={row} />
      </CollapsibleContent>
    </Collapsible>
  );
}
