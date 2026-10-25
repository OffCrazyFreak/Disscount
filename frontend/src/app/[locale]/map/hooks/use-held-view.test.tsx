import type { FocusEvent } from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useHeldView } from "@/app/[locale]/map/hooks/use-held-view";
import { IViewArea } from "@/app/[locale]/map/utils/view-area";

function box(west: number, south: number, east: number, north: number) {
  return {
    corners: [
      [west, north],
      [east, north],
      [east, south],
      [west, south],
    ],
  } as IViewArea;
}

const ZAGREB = box(15.9, 45.7, 16.1, 45.9);
const SPLIT = box(16.3, 43.4, 16.6, 43.6);

function setup() {
  return renderHook(({ live }) => useHeldView(live), {
    initialProps: { live: ZAGREB as IViewArea | null },
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

  it("stops holding after the update chip, whose removal fires no blur", () => {
    const { result, rerender } = setup();
    const keyboardFocus = {
      target: { matches: () => true },
    } as unknown as FocusEvent<HTMLElement>;

    act(() => result.current.holdProps.onFocus(keyboardFocus));
    rerender({ live: SPLIT });
    act(() => result.current.apply());
    rerender({ live: ZAGREB });

    expect(result.current.applied).toEqual(ZAGREB);
    expect(result.current.pending).toBe(false);
  });
});
