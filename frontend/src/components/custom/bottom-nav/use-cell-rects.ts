"use client";

import { useRef, type RefCallback } from "react";

/**
 * Resolves a press to the cell whose centre is nearest, measured from the cells'
 * own boxes. Dividing the bar's width would skew every boundary, because the
 * pill has inner padding, and nearest-centre also answers for a press that
 * lands in that padding rather than on any cell.
 */
export default function useCellRects() {
  const cells = useRef<(HTMLElement | null)[]>([]);
  const setters = useRef<RefCallback<HTMLElement>[]>([]);

  function registerCell(index: number): RefCallback<HTMLElement> {
    setters.current[index] ??= (element) => {
      cells.current[index] = element;
    };

    return setters.current[index];
  }

  function indexFromClientX(clientX: number): number | null {
    let nearest: number | null = null;
    let shortest = Number.POSITIVE_INFINITY;

    for (let index = 0; index < cells.current.length; index += 1) {
      const element = cells.current[index];
      if (!element) continue;

      const rect = element.getBoundingClientRect();
      const distance = Math.abs(clientX - (rect.left + rect.width / 2));

      if (distance < shortest) {
        shortest = distance;
        nearest = index;
      }
    }

    return nearest;
  }

  function cellAt(index: number): HTMLElement | null {
    return cells.current[index] ?? null;
  }

  return { registerCell, indexFromClientX, cellAt };
}
