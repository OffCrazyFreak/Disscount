import { act, renderHook } from "@testing-library/react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { describe, expect, it, vi } from "vitest";

import useBottomNavPointer from "@/components/custom/bottom-nav/use-bottom-nav-pointer";

vi.mock("@/components/custom/bottom-nav/bar-hit-test", () => ({
  default: () => 0,
  navCells: () => [],
}));

function pressOn(list: HTMLUListElement) {
  return {
    currentTarget: list,
    pointerId: 1,
    pointerType: "touch",
    button: 0,
    isPrimary: true,
    clientX: 200,
    clientY: 10,
  } as unknown as ReactPointerEvent<HTMLUListElement>;
}

function renderPointer() {
  return renderHook(() =>
    useBottomNavPointer({
      onActivate: () => true,
      holdFor: () => null,
      routeKey: "/",
    }),
  );
}

describe("useBottomNavPointer", () => {
  it("ignores a press whose pointer is already gone", () => {
    const list = document.createElement("ul");
    list.setPointerCapture = () => {
      throw new DOMException("No active pointer", "NotFoundError");
    };
    const { result } = renderPointer();

    expect(() =>
      act(() => result.current.listProps.onPointerDown(pressOn(list))),
    ).not.toThrow();
    expect(result.current.scrubIndex).toBeNull();
  });

  it("starts a scrub when capture succeeds", () => {
    const list = document.createElement("ul");
    list.setPointerCapture = () => {};
    const { result } = renderPointer();

    act(() => result.current.listProps.onPointerDown(pressOn(list)));

    expect(result.current.scrubIndex).toBe(0);
  });
});
