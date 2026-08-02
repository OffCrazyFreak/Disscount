"use client";

import { ChevronsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useScrolledPast } from "@/hooks/use-scrolled-past";
import { scrollToTop } from "@/utils/scroll";

/** Far enough down that the button answers a real problem rather than nagging */
const THRESHOLD_PX = 600;

const LABEL = "Natrag na vrh";

/**
 * Returns a long, scrolled page to the top.
 *
 * Material's regular FAB is 56dp with a 24dp icon, held 24dp off the edge of a
 * desktop window. The 28px icon optically compensates for the empty space in
 * Lucide's double-chevron view box. These are explicit rem values because this
 * project sets --spacing to 0.2rem, so numeric size utilities render smaller
 * than their usual pixel equivalents.
 *
 * Desktop only: on mobile the bottom nav's active tab does this, and the bar
 * already owns that corner. Mounted once in the root layout, so every page long
 * enough to scroll gets one without having to ask.
 */
export default function BackToTopButton() {
  const isVisible = useScrolledPast(THRESHOLD_PX);

  return (
    // Click-through, so the hidden button leaves no dead zone in the corner.
    <div className="pointer-events-none fixed right-[1.5rem] bottom-[1.5rem] z-[var(--z-fab)] hidden md:block">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon"
            aria-label={LABEL}
            onClick={scrollToTop}
            // inert also clears the tab order and the a11y tree, which opacity
            // alone leaves behind.
            inert={!isVisible}
            className={cn(
              // No sm: variants here: the base classes already apply at every
              // width, so restating them at a breakpoint only read as if some
              // rule existed for them to override.
              "pointer-events-auto size-[3.5rem] rounded-full shadow-lg [&_svg]:size-[1.75rem]!",
              "transition duration-300 motion-reduce:transition-none",
              isVisible ? "scale-100 opacity-100" : "scale-75 opacity-0",
            )}
          >
            <ChevronsUp />
          </Button>
        </TooltipTrigger>

        <TooltipContent side="left">{LABEL}</TooltipContent>
      </Tooltip>
    </div>
  );
}
