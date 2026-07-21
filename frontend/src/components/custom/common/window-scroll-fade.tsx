"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import EdgeFade from "@/components/custom/common/edge-fade";

interface IWindowScrollFadeProps {
  /** Edge to fade against, defaulting to the bottom */
  side?: "top" | "bottom";
  /** Positioning + colour overrides, e.g. "z-40 from-background" */
  className?: string;
}

/**
 * Fixed EdgeFade for full-page (window-scrolled) layouts: the window
 * counterpart to ScrollFade. Hides once the document is scrolled to that edge,
 * so the bottom fade disappears when you reach the end of the page.
 */
export default function WindowScrollFade({
  side = "bottom",
  className,
}: IWindowScrollFadeProps) {
  const [hasHiddenContent, setHasHiddenContent] = useState(false);

  useEffect(() => {
    function update() {
      const scrolledToEnd =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 1;

      setHasHiddenContent(side === "top" ? window.scrollY > 0 : !scrolledToEnd);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    // Content growing (images, lazy sections) changes scrollHeight without a
    // scroll or resize event, so watch the body too.
    const observer = new ResizeObserver(update);
    observer.observe(document.body);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer.disconnect();
    };
  }, [side]);

  return (
    <EdgeFade
      side={side}
      className={cn(
        "fixed transition-opacity duration-200",
        hasHiddenContent ? "opacity-100" : "opacity-0",
        className,
      )}
    />
  );
}
