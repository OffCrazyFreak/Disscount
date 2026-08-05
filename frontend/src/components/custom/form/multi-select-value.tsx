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
  clickToRemove?: boolean;
  overflowBehavior?: "wrap" | "wrap-when-open" | "cutoff";
}

export default function MultiSelectValue({
  placeholder,
  clickToRemove = true,
  className,
  overflowBehavior = "wrap-when-open",
  ...props
}: IMultiSelectValueProps) {
  const { selectedValues, toggleValue, items, open } = useMultiSelectContext();

  const shouldWrap =
    overflowBehavior === "wrap" ||
    (overflowBehavior === "wrap-when-open" && open);

  const { containerRef, overflowRef, overflowAmount } = useBadgeOverflow(
    selectedValues,
    shouldWrap,
    items,
  );

  if (selectedValues.size === 0 && placeholder) {
    // Keeps the caller's props: an id or aria attribute that vanished until
    // something was selected would break whatever pointed at it.
    return (
      <span
        {...props}
        className={cn(
          "min-w-0 overflow-hidden font-normal text-muted-foreground",
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
        "flex w-full gap-1.5 overflow-hidden",
        shouldWrap && "h-full flex-wrap",
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
            onClick={
              clickToRemove
                ? (e) => {
                    e.stopPropagation();
                    e.preventDefault();

                    toggleValue(value);
                  }
                : undefined
            }
          >
            {items.get(value)}
            {clickToRemove && (
              <XIcon
                aria-hidden="true"
                className="size-3.5 shrink-0 text-muted-foreground group-hover:text-destructive"
              />
            )}
          </Badge>
        ))}
      <Badge
        style={{
          display: overflowAmount > 0 && !shouldWrap ? "block" : "none",
        }}
        variant="outline"
        ref={overflowRef}
      >
        +{overflowAmount}
      </Badge>

      {/* The X on a badge is pointer-only: a badge sits inside the trigger
          button, so it cannot be a control of its own without nesting one. This
          says so, and names the equivalent path, which the list already offers. */}
      {clickToRemove && selectedValues.size > 0 && (
        <span
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          Odabrano ih je {selectedValues.size}. Otvori popis i odaberi stavku da
          je ukloniš.
        </span>
      )}
    </div>
  );
}
