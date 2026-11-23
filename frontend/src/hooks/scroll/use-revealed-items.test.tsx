import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useRevealedItems } from "@/hooks/scroll/use-revealed-items";

const ITEMS = Array.from({ length: 5 }, (_, index) => index);

describe("useRevealedItems", () => {
  it("reveals only the first batch", () => {
    const { result } = renderHook(() => useRevealedItems(ITEMS, "key", 2));

    expect(result.current).toEqual([0, 1]);
  });

  it("returns the same array while the items stay the same", () => {
    const { result, rerender } = renderHook(() =>
      useRevealedItems(ITEMS, "key", 2),
    );
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
