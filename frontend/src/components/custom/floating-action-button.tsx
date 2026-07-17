"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface IFloatingActionButtonProps extends ButtonProps {
  icon: ReactNode;
  /** Names the button, and labels it on hover unless `tooltip` is off */
  label: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  /** Overrides the fixed placement, e.g. to stack above another button */
  containerClassName?: string;
  /** Turn off for a touch-only button, where a tooltip can never open */
  tooltip?: boolean;
}

// Material places a FAB 16px from the edges on compact windows and 24px from
// medium up.
const positionClasses = {
  "bottom-right": "bottom-4 right-4 sm:bottom-6 sm:right-6",
  "bottom-left": "bottom-4 left-4 sm:bottom-6 sm:left-6",
  "top-right": "top-4 right-4 sm:top-6 sm:right-6",
  "top-left": "top-4 left-4 sm:top-6 sm:left-6",
};

export function FloatingActionButton({
  icon,
  label,
  className,
  position = "bottom-right",
  containerClassName,
  tooltip = true,
  ...props
}: IFloatingActionButtonProps) {
  const button = (
    <Button
      type="button"
      size="icon"
      aria-label={label}
      className={cn(
        "pointer-events-auto size-16 rounded-full shadow-lg",
        className,
      )}
      {...props}
    >
      {icon}
    </Button>
  );

  return (
    // The wrapper tracks the button's size, so it stays click-through to keep
    // a hidden or disabled button from leaving a dead zone over the page.
    <div
      className={cn(
        "pointer-events-none fixed z-50",
        positionClasses[position],
        containerClassName,
      )}
    >
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>

          <TooltipContent side="left">{label}</TooltipContent>
        </Tooltip>
      ) : (
        button
      )}
    </div>
  );
}
