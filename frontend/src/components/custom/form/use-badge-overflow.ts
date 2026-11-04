"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

interface IBadgeOverflow {
  /** Attach to the badge row. Also observes it for resizes. */
  containerRef: (node: HTMLDivElement) => () => void;
  /** Attach to the "+N" badge, which is hidden and revealed by measuring. */
  overflowRef: React.RefObject<HTMLDivElement | null>;
  overflowAmount: number;
}

/** Measured rather than calculated, because badge widths depend on the label, the font and the user's text size. */
export default function useBadgeOverflow(
  selectedValues: Set<string>,
  shouldWrap: boolean,
  // The registry is a new Map on every registration, which retriggers measurement once the badges exist.
  items: Map<string, unknown>,
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

    // A single badge wider than the box still reports overflow while wrapping, so the loop would reveal a "+N" that contradicts the screen.
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

  // The overflow count needs real laid-out nodes, so setState runs in a layout effect, and before paint stops the "+N" flickering.
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkOverflow();
  }, [selectedValues, checkOverflow, items]);

  const containerRef = useCallback(
    (node: HTMLDivElement) => {
      valueRef.current = node;
      let isDetached = false;

      const observer = new ResizeObserver(checkOverflow);
      observer.observe(node);

      // A web font arriving after the first measurement widens the badges but not the row, so the observer never fires; jsdom has no FontFaceSet.
      document.fonts?.ready.then(() => {
        if (!isDetached) checkOverflow();
      });

      return () => {
        isDetached = true;
        observer.disconnect();
        valueRef.current = null;
      };
    },
    [checkOverflow],
  );

  return { containerRef, overflowRef, overflowAmount };
}
