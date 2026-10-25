import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useHeldView } from "@/app/[locale]/map/hooks/use-held-view";
import { IViewBounds } from "@/app/[locale]/map/utils/view-bounds";

const ZAGREB: IViewBounds = {
  west: 15.9,
  south: 45.7,
  east: 16.1,
  north: 45.9,
};
const SPLIT: IViewBounds = { west: 16.3, south: 43.4, east: 16.6, north: 43.6 };

function setup() {
  return renderHook(({ live }) => useHeldView(live), {
    initialProps: { live: ZAGREB as IViewBounds | null },
  });
}

describe("useHeldView", () => {
  it("follows the map while nobody is in the list", () => {
    const { result, rerender } = setup();

    rerender({ live: SPLIT });

    expect(result.current.applied).toEqual(SPLIT);
    expect(result.current.pending).toBe(false);
  });

  it("waits while the pointer is in the list, then applies on leaving", () => {
    const { result, rerender } = setup();

    act(() => result.current.holdProps.onPointerEnter());
    rerender({ live: SPLIT });

    expect(result.current.applied).toEqual(ZAGREB);
    expect(result.current.pending).toBe(true);

    act(() => result.current.holdProps.onPointerLeave());

    expect(result.current.applied).toEqual(SPLIT);
    expect(result.current.pending).toBe(false);
  });

  it("applies a held view when asked", () => {
    const { result, rerender } = setup();

    act(() => result.current.holdProps.onPointerEnter());
    rerender({ live: SPLIT });
    act(() => result.current.apply());

    expect(result.current.applied).toEqual(SPLIT);
    expect(result.current.pending).toBe(false);
  });
});
