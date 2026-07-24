"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Colour lives in a variant so the box and the arrow always match. A red
// delete button should get a red tooltip, not the default primary green.
const tooltipContentVariants = cva(
  "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-2 py-1 text-xs text-pretty",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground",
        destructive: "bg-red-600 text-white",
        destructiveSoft:
          "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300",
        warning: "bg-amber-200 text-amber-700",
        warningSoft:
          "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
        neutral: "bg-popover text-popover-foreground border shadow-md",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

const tooltipArrowVariants = cva(
  "z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]",
  {
    variants: {
      variant: {
        primary: "bg-primary fill-primary",
        destructive: "bg-red-600 fill-red-600",
        destructiveSoft:
          "bg-red-50 fill-red-50 text-red-600 dark:bg-red-950 dark:fill-red-950 dark:text-red-300",
        warning: "bg-amber-200 fill-amber-200 text-amber-700",
        warningSoft:
          "bg-amber-50 fill-amber-50 text-amber-600 dark:bg-amber-950 dark:fill-amber-950 dark:text-amber-300",
        neutral: "bg-popover fill-popover border",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  );
}

function TooltipTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      className={cn(className)}
      {...props}
    />
  );
}
function TooltipContent({
  className,
  sideOffset = 0,
  variant,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content> &
  VariantProps<typeof tooltipContentVariants>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(tooltipContentVariants({ variant }), className)}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className={tooltipArrowVariants({ variant })} />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
