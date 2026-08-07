"use client";

import type { ComponentProps } from "react";
import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Plain button props rather than Button's own: its icon props are a union that
// collapses once they are spread through a wrapper, and this trigger never
// takes a leading icon anyway.
interface IPriceInfoButtonProps extends Omit<
  ComponentProps<"button">,
  "children"
> {
  label: string;
}

/**
 * The info affordance that sits beside a price, on a product card and on a
 * watchlist card alike. Sized here rather than per caller because it is the
 * tallest thing in either row, so a caller picking its own size silently
 * changes how tall that card is.
 *
 * The box hugs the glyph, which leaves it at 24px square: the WCAG 2.5.8 AA
 * floor exactly, with nothing to spare. Do not shrink it further. The size goes
 * on the icon rather than through a [&_svg] variant, because the button's own
 * icon rule guards on :not([class*='size-']) and would otherwise outrank it.
 *
 * Both callers hand this to a Radix trigger as a child, so it has to forward a ref.
 * React is 19 here, where ref is an ordinary prop, so no forwardRef wrapper is needed.
 */
export default function PriceInfoButton({
  label,
  className,
  ref,
  ...props
}: IPriceInfoButtonProps) {
  return (
    <Button
      ref={ref}
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      className={cn("size-6 p-0", className)}
      {...props}
    >
      <Info aria-hidden="true" className="size-6" />
    </Button>
  );
}
