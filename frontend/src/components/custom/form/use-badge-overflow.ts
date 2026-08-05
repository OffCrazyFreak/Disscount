"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

interface IBadgeOverflow {
  /** Attach to the badge row. Also observes it for resizes. */
  containerRef: (node: HTMLDivElement) => () => void;
  /** Attach to the "+N" badge, which is hidden and revealed by measuring. */
  overflowRef: React.RefObject<HTMLDivElement | null>;
  overflowAmount: number;
}

/**
 * Hides badges from the end of the row until they fit, and reports how many
 * went, so a "+N" can stand in for them.
 *
 * Measured rather than calculated: badge widths depend on the label, the font
 * and the user's text size, none of which are known ahead of layout.
 */
export default function useBadgeOverflow(
  selectedValues: Set<string>,
  shouldWrap: boolean,
): IBadgeOverflow {
  const [overflowAmount, setOverflowAmount] = useState(0);
  const valueRef = useRef<HTMLDivElement>(null);
  const overflowRef = useRef<HTMLDivElement>(null);

  const checkOverflow = useCallback(() => {
    if (valueRef.current == null) return;

    const containerElement = valueRef.current;
    const overflowElement = overflowRef.current;
    const itemElements = containerElement.querySelectorAll<HTMLElement>(
      "[data-selected-item]",
    );

    if (overflowElement != null) overflowElement.style.display = "none";
    itemElements.forEach((child) => child.style.removeProperty("display"));

    // Wrapping already shows every badge, and a single badge wider than the box
    // still reports scrollWidth > clientWidth, so without this the loop would
    // hide badges and reveal a "+N" that contradicts what is on screen.
    if (shouldWrap) {
      setOverflowAmount(0);
      return;
    }

    let amount = 0;
    for (let i = itemElements.length - 1; i >= 0; i--) {
      const child = itemElements[i];
      if (containerElement.scrollWidth <= containerElement.clientWidth) break;

      amount = itemElements.length - i;
      child.style.display = "none";
      overflowElement?.style.removeProperty("display");
    }

    setOverflowAmount(amount);
  }, [shouldWrap]);

  useLayoutEffect(() => {
    checkOverflow();
  }, [selectedValues, checkOverflow]);

  const containerRef = useCallback(
    (node: HTMLDivElement) => {
      valueRef.current = node;

      const observer = new ResizeObserver(checkOverflow);
      observer.observe(node);

      return () => {
        observer.disconnect();
        valueRef.current = null;
      };
    },
    [checkOverflow],
  );

  return { containerRef, overflowRef, overflowAmount };
}
