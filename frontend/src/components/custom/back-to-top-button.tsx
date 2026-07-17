"use client";

import { ChevronsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { FloatingActionButton } from "@/components/custom/floating-action-button";
import { useScrolledPast } from "@/hooks/use-scrolled-past";

interface IBackToTopButtonProps {
  /** How far to scroll before the button appears */
  threshold?: number;
  label?: string;
}

/**
 * Returns a long, scrolled page to the top.
 *
 * Sits one step in from the viewport edge (16px, 24px from sm up) and stays
 * smaller than the primary action FAB, so a page carrying both reads the
 * create button as the more important of the two.
 */
export default function BackToTopButton({
  threshold = 600,
  label = "Natrag na vrh",
}: IBackToTopButtonProps) {
  const isVisible = useScrolledPast(threshold);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <FloatingActionButton
      onClick={scrollToTop}
      icon={<ChevronsUp className="size-6" />}
      label={label}
      containerClassName="bottom-4 right-4 sm:bottom-6 sm:right-6"
      // inert also takes it out of the tab order and the accessibility tree,
      // which opacity alone would leave behind.
      inert={!isVisible}
      className={cn(
        "size-12 sm:size-14 transition duration-300 motion-reduce:transition-none",
        isVisible ? "scale-100 opacity-100" : "scale-75 opacity-0",
      )}
    />
  );
}
