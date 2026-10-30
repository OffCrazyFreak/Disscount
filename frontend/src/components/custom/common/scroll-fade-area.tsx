"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import ScrollFade from "@/components/custom/common/scroll-fade";

interface IScrollFadeAreaProps {
  /** Sizing and layout of the scrolling element, e.g. its max height */
  className?: string;
  /** Sizing of the positioning wrapper, e.g. "flex-1" inside a column */
  wrapperClassName?: string;
  /** Gradient colour and height for both fades, matching the surface */
  fadeClassName?: string;
  children: ReactNode;
}

/**
 * A vertical scroller with ScrollFade on both edges, for lists and bodies that
 * own their scroll element. Use ScrollFade directly where a primitive owns it.
 */
export default function ScrollFadeArea({
  className,
  wrapperClassName,
  fadeClassName,
  children,
}: IScrollFadeAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className={cn("relative flex min-h-0 flex-col", wrapperClassName)}>
      {/* Scroll padding keeps a focused row out from under the fades. */}
      <div
        ref={scrollRef}
        className={cn("min-h-0 scroll-py-12 overflow-y-auto", className)}
      >
        {children}
      </div>

      <ScrollFade targetRef={scrollRef} side="top" className={fadeClassName} />

      <ScrollFade targetRef={scrollRef} className={fadeClassName} />
    </div>
  );
}
