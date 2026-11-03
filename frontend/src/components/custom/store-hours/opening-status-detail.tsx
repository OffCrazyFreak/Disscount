"use client";

import type { MouseEvent, ReactNode } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFinePointer } from "@/hooks/use-fine-pointer";

interface IOpeningStatusDetailProps {
  id?: string;
  /** The full status, such as "Otvoreno, zatvara uskoro u 21:00". */
  name: string;
  /** The tooltip line, such as "Zatvara uskoro u 21:00". */
  detail: string;
  /** The badge. */
  children: ReactNode;
}

// The row a badge sits in may itself open or toggle on a click.
function keepToBadge(event: MouseEvent) {
  event.stopPropagation();
}

/**
 * Makes the badge a button that shows when the store opens or closes: a
 * tooltip on hover and keyboard focus, a popover on tap, since a touch screen
 * has no hover and Radix tooltips ignore taps.
 */
export default function OpeningStatusDetail({
  id,
  name,
  detail,
  children,
}: IOpeningStatusDetailProps) {
  const hasFinePointer = useFinePointer();
  // Above a row's full-size toggle, with a tap area larger than the badge.
  const trigger = (
    <button
      type="button"
      id={id}
      aria-label={name}
      onClick={keepToBadge}
      className="relative z-10 inline-flex rounded-full after:absolute after:-inset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {children}
    </button>
  );

  if (hasFinePointer) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent variant="neutral" side="top">
          {detail}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent side="top" className="w-auto px-3 py-2 text-xs">
        {detail}
      </PopoverContent>
    </Popover>
  );
}
