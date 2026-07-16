"use client";

import { useEffect, useState, type RefObject } from "react";
import { cn } from "@/lib/utils";

interface IScrollFadeProps {
  /** Scroll container to watch; the fade hides once it is scrolled to the end */
  targetRef: RefObject<HTMLElement | null>;
  /** Override the gradient colour to match the surface, e.g. "from-sidebar" */
  className?: string;
}

/**
 * Gradient overlay hinting at content below the fold. Place it as the last
 * child of a `relative` wrapper around a scrollable element.
 */
export default function ScrollFade({ targetRef, className }: IScrollFadeProps) {
  const [hasContentBelow, setHasContentBelow] = useState(false);

  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    function update() {
      if (!element) return;

      const scrolledToEnd =
        element.scrollTop + element.clientHeight >= element.scrollHeight - 1;
      setHasContentBelow(!scrolledToEnd);
    }

    update();
    element.addEventListener("scroll", update, { passive: true });

    // Watches the content, not the container: items loading in change how
    // much is scrollable without resizing the element itself.
    const observer = new ResizeObserver(update);
    for (const child of element.children) observer.observe(child);

    return () => {
      element.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [targetRef]);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent transition-opacity duration-200",
        hasContentBelow ? "opacity-100" : "opacity-0",
        className,
      )}
    />
  );
}
