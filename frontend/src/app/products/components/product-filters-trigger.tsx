"use client";

import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface IProductFiltersTriggerProps extends ButtonProps {
  /** Selected values, not active facets, matching activeFilterCount */
  count: number;
  /** Set only on a toggle, which earns the chevron; omit it for a sheet opener */
  expanded?: boolean;
}

/**
 * Opens the filters, wherever they live. Spreads the rest of its props so
 * `CollapsibleTrigger asChild` can drive it as well as a plain click handler.
 */
export default function ProductFiltersTrigger({
  count,
  expanded,
  className,
  ...props
}: IProductFiltersTriggerProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn("bg-white", className)}
      {...props}
    >
      <SlidersHorizontal className="size-5" />
      Filteri
      {count > 0 && <Badge>{count}</Badge>}
      {expanded !== undefined && (
        <ChevronDown
          className={cn(
            "size-5 transition-transform duration-200 motion-reduce:transition-none",
            expanded && "rotate-180",
          )}
        />
      )}
    </Button>
  );
}
