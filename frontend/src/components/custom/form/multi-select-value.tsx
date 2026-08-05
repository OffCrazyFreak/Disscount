"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import { XIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useMultiSelectContext } from "@/components/custom/form/multi-select-context";
import { cn } from "@/lib/utils";

interface IMultiSelectValueProps extends Omit<
  ComponentPropsWithoutRef<"div">,
  "children"
> {
  placeholder?: string;
  clickToRemove?: boolean;
  overflowBehavior?: "wrap" | "wrap-when-open" | "cutoff";
}

export function MultiSelectValue({
  placeholder,
  clickToRemove = true,
  className,
  overflowBehavior = "wrap-when-open",
  ...props
}: IMultiSelectValueProps) {
  const { selectedValues, toggleValue, items, open } = useMultiSelectContext();
  const [overflowAmount, setOverflowAmount] = useState(0);
  const valueRef = useRef<HTMLDivElement>(null);
  const overflowRef = useRef<HTMLDivElement>(null);

  const shouldWrap =
    overflowBehavior === "wrap" ||
    (overflowBehavior === "wrap-when-open" && open);

  const checkOverflow = useCallback(() => {
    if (valueRef.current == null) return;

    const containerElement = valueRef.current;
    const overflowElement = overflowRef.current;
    const itemElements = containerElement.querySelectorAll<HTMLElement>(
      "[data-selected-item]",
    );

    if (overflowElement != null) overflowElement.style.display = "none";
    itemElements.forEach((child) => child.style.removeProperty("display"));

    // Wrapping already shows every badge, and a single badge wider than the box
    // still reports scrollWidth > clientWidth, so without this the loop would
    // hide badges and reveal a "+N" that contradicts what is on screen.
    if (shouldWrap) {
      setOverflowAmount(0);
      return;
    }

    let amount = 0;
    for (let i = itemElements.length - 1; i >= 0; i--) {
      const child = itemElements[i];
      if (containerElement.scrollWidth <= containerElement.clientWidth) {
        break;
      }
      amount = itemElements.length - i;
      child.style.display = "none";
      overflowElement?.style.removeProperty("display");
    }
    setOverflowAmount(amount);
  }, [shouldWrap]);

  useLayoutEffect(() => {
    checkOverflow();
  }, [selectedValues, checkOverflow, shouldWrap]);

  const handleResize = useCallback(
    (node: HTMLDivElement) => {
      valueRef.current = node;

      const observer = new ResizeObserver(checkOverflow);
      observer.observe(node);

      return () => {
        observer.disconnect();
        valueRef.current = null;
      };
    },
    [checkOverflow],
  );

  if (selectedValues.size === 0 && placeholder) {
    return (
      <span className="min-w-0 overflow-hidden font-normal text-muted-foreground">
        {placeholder}
      </span>
    );
  }

  return (
    <div
      {...props}
      ref={handleResize}
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
        <span className="sr-only">
          Odabrano ih je {selectedValues.size}. Otvori popis i odaberi stavku da
          je ukloniš.
        </span>
      )}
    </div>
  );
}
