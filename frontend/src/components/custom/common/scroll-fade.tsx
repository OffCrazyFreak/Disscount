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
    function observeChildren() {
      if (!element) return;

      observer.disconnect();
      // The scroller itself too: a modal growing with the window can stop overflowing.
      observer.observe(element);
      for (const child of element.children) observer.observe(child);
    }

    observeChildren();

    // Conditional content swaps the children themselves (a spinner for the
    // rows), and a node mounted later would otherwise never be measured.
    const mutations = new MutationObserver(() => {
      observeChildren();
      update();
    });
    mutations.observe(element, { childList: true });

    return () => {
      element.removeEventListener("scroll", update);
      observer.disconnect();
      mutations.disconnect();
    };
  }, [targetRef, side]);

  return (
    <EdgeFade
      side={side}
      className={cn(
        "absolute transition-opacity duration-200 motion-reduce:transition-none",
        hasHiddenContent ? "opacity-100" : "opacity-0",
        className,
      )}
    />
  );
}
