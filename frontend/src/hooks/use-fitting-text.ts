"use client";

import { type RefObject, useLayoutEffect, useState } from "react";

/**
 * `preferred` while it fits on one line in the text box of the ref'd element, else
 * `fallback`. Measured with the element's own font, so it holds in every locale and
 * at every width, which a breakpoint cannot promise. Without a `fallback` nothing is
 * measured.
 */
export function useFittingText(
  ref: RefObject<HTMLElement | null>,
  preferred: string,
  fallback?: string,
) {
  // Starts on the full text: an overflowing placeholder already ends in a CSS ellipsis.
  const [fits, setFits] = useState(true);

  useLayoutEffect(() => {
    const element = ref.current;
    const context = document.createElement("canvas").getContext("2d");
    if (!element || !context || fallback === undefined) return;

    let textBoxWidth = 0;

    function measure() {
      if (!element || !context) return;

      const style = getComputedStyle(element);
      context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      context.letterSpacing = style.letterSpacing;
      setFits(context.measureText(preferred).width <= textBoxWidth);
    }

    // Also fires once on observe, which is the first measurement.
    const observer = new ResizeObserver(([entry]) => {
      textBoxWidth = entry.contentRect.width;
      measure();
    });
    observer.observe(element);

    // A web font arriving later changes the text width but not the box.
    let isDetached = false;
    document.fonts?.ready.then(() => {
      if (!isDetached) measure();
    });

    return () => {
      isDetached = true;
      observer.disconnect();
    };
  }, [ref, preferred, fallback]);

  return fits || fallback === undefined ? preferred : fallback;
}
