"use client";

import { ChevronsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import FloatingActionButton from "@/components/custom/fab/floating-action-button";
import { useScrolledPast } from "@/hooks/use-scrolled-past";
import { scrollToTop } from "@/utils/scroll";

interface IBackToTopButtonProps {
  /** How far to scroll before the button appears */
  threshold?: number;
  containerClassName?: string;
  label?: string;
}

/**
 * Returns a long, scrolled page to the top.
 *
 * Stays smaller than the primary action FAB, so a page carrying both reads the
 * create button as the more important of the two.
 */
export default function BackToTopButton({
  threshold = 600,
  containerClassName,
  label = "Natrag na vrh",
}: IBackToTopButtonProps) {
  const isVisible = useScrolledPast(threshold);

  return (
    <FloatingActionButton
      onClick={scrollToTop}
      icon={<ChevronsUp className="size-6" />}
      label={label}
      containerClassName={containerClassName}
      // inert also clears the tab order and a11y tree, which opacity alone leaves.
      inert={!isVisible}
      className={cn(
        "size-12 sm:size-14 transition duration-300 motion-reduce:transition-none",
        isVisible ? "scale-100 opacity-100" : "scale-75 opacity-0",
      )}
    />
  );
}
