"use client";

import type { ComponentPropsWithoutRef } from "react";
import { XIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useMultiSelectContext } from "@/components/custom/form/multi-select-context";
import useBadgeOverflow from "@/components/custom/form/use-badge-overflow";
import { cn } from "@/lib/utils";

interface IMultiSelectValueProps extends Omit<
  ComponentPropsWithoutRef<"div">,
  "children"
> {
  placeholder?: string;
}

export default function MultiSelectValue({
  placeholder,
  className,
  ...props
}: IMultiSelectValueProps) {
  const { selectedValues, toggleValue, items, open } = useMultiSelectContext();

  const { containerRef, overflowRef, overflowAmount } = useBadgeOverflow(
    selectedValues,
    open,
    items,
  );

  if (selectedValues.size === 0 && placeholder) {
    // Keeps the caller's props, because a vanishing id or aria attribute breaks what points at it.
    return (
      <span
        {...props}
        className={cn(
          "min-w-0 truncate font-normal text-muted-foreground",
          className,
        )}
      >
        {placeholder}
      </span>
    );
  }

  return (
    <div
      {...props}
      ref={containerRef}
      className={cn(
        // min-w-0 undoes a flex item's automatic minimum, or the row never scrolls and badges spill.
        "flex w-full min-w-0 gap-1.5 overflow-hidden",
        // About three and a half rows, so the cut-off shows it scrolls and the list stays on a phone.
        open && "h-full max-h-26 flex-wrap overflow-y-auto overscroll-contain",
        className,
      )}
    >
      {[...selectedValues]
        .filter((value) => items.has(value))
        .map((value) => (
          <Badge
            variant="outline"
            data-selected-item
            className="group"
            key={value}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();

              toggleValue(value);
            }}
          >
            {items.get(value)}
            {/* Pointer-only, as a badge in the trigger cannot be a control; the list is the keyboard path. */}
            <XIcon
              aria-hidden="true"
              className="size-3.5 shrink-0 text-muted-foreground group-hover:text-destructive"
            />
          </Badge>
        ))}
      <Badge
        style={{
          display: overflowAmount > 0 && !open ? "block" : "none",
        }}
        variant="outline"
        ref={overflowRef}
      >
        +{overflowAmount}
      </Badge>
    </div>
  );
}
