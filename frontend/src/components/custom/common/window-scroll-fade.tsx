"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import EdgeFade from "@/components/custom/common/edge-fade";

interface IWindowScrollFadeProps {
  /** Edge to fade against, defaulting to the bottom */
  side?: "top" | "bottom";
  /** Overrides the default z-index, height and colour classes */
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

    // Growing content changes scrollHeight without firing scroll or resize.
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
        "fixed z-40 h-28 via-background/70 transition-opacity duration-200",
        hasHiddenContent ? "opacity-100" : "opacity-0",
        className,
      )}
    />
  );
}
