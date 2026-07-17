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
  /** Names the button and doubles as its tooltip */
  label: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  /** Overrides the fixed placement, e.g. to sit closer to the viewport edge */
  containerClassName?: string;
}

const positionClasses = {
  "bottom-right": "bottom-28 right-4",
  "bottom-left": "bottom-28 left-4",
  "top-right": "top-28 right-4",
  "top-left": "top-28 left-4",
};

export function FloatingActionButton({
  icon,
  label,
  className,
  position = "bottom-right",
  containerClassName,
  ...props
}: IFloatingActionButtonProps) {
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
      <Tooltip>
        <TooltipTrigger asChild>
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
        </TooltipTrigger>

        <TooltipContent side="left">{label}</TooltipContent>
      </Tooltip>
    </div>
  );
}
