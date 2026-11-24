"use client";

import type { ComponentProps } from "react";
import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Plain button props because Button's icon props are a union that collapses once spread through a wrapper.
interface IPriceInfoButtonProps extends Omit<
  ComponentProps<"button">,
  "children"
> {
  label: string;
}

/** It sets the row's height, and 24px is the WCAG 2.5.8 floor; on the icon so [&_svg] cannot outrank it. */
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
