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
        // min-w-0 undoes a flex item's automatic minimum, which here is the
        // combined width of every badge, since each one is shrink-0 and
        // nowrap. Without it the row cannot shrink, so it never scrolls, the
        // overflow measurement always reads zero and the badges just spill.
        "flex w-full min-w-0 gap-1.5 overflow-hidden",
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
            {/* Decorative, and the click behind it is pointer-only on purpose: a
                badge renders inside the trigger button, so it cannot become a
                control without nesting one. Deselecting in the list is the
                keyboard and screen-reader path. Nothing is announced from in
                here, because text inside the button becomes part of the
                button's own accessible name. */}
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
    </div>
  );
}
