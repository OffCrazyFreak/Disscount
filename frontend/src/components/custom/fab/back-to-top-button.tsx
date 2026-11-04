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

/** Explicit rem values because --spacing is 0.2rem; desktop only because on mobile the bottom nav's active tab does this. */
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
            // inert also clears the tab order and a11y tree, which opacity alone leaves behind.
            inert={!isVisible}
            className={cn(
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
