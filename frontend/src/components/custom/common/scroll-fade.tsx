"use client";

import { useEffect, useState, type RefObject } from "react";
import { cn } from "@/lib/utils";
import EdgeFade from "@/components/custom/common/edge-fade";

interface IScrollFadeProps {
  /** Scroll container to watch; the fade hides once it is scrolled to that end */
  targetRef: RefObject<HTMLElement | null>;
  /** Edge to fade against, defaulting to the bottom */
  side?: "top" | "bottom";
  /** Override the gradient colour to match the surface, e.g. "from-sidebar" */
  className?: string;
}

/**
 * Gradient overlay hinting at content past an edge. Place it as a child of a
 * `relative` wrapper around a scrollable element.
 */
export default function ScrollFade({
  targetRef,
  side = "bottom",
  className,
}: IScrollFadeProps) {
  const [hasHiddenContent, setHasHiddenContent] = useState(false);

  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    function update() {
      if (!element) return;

      const scrolledToEnd =
        element.scrollTop + element.clientHeight >= element.scrollHeight - 1;

      setHasHiddenContent(
        side === "top" ? element.scrollTop > 0 : !scrolledToEnd,
      );
    }

    update();
    element.addEventListener("scroll", update, { passive: true });

    // Watch the content: items loading in change scrollability, not element size.
    const observer = new ResizeObserver(update);
    for (const child of element.children) observer.observe(child);

    return () => {
      element.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [targetRef, side]);

  return (
    <EdgeFade
      side={side}
      className={cn(
        "absolute transition-opacity duration-200",
        hasHiddenContent ? "opacity-100" : "opacity-0",
        className,
      )}
    />
  );
}
