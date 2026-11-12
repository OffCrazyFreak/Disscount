import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  HEADER_SLOT_ID,
  HEADER_SLOT_OPEN_ATTR,
} from "@/components/custom/header/header-slot";
import { useHeaderSlot } from "@/app/[locale]/map/hooks/use-header-slot";

const observer = { report: () => {} };

function frameAt(left: number, right: number) {
  const frame = document.querySelector<HTMLElement>("[data-header-frame]")!;
  frame.getBoundingClientRect = () =>
    ({ top: 16, bottom: 72, left, right }) as DOMRect;
}

describe("useHeaderSlot", () => {
  beforeEach(() => {
    document.body.innerHTML = `<div data-header-frame><div id="${HEADER_SLOT_ID}"></div></div>`;
    // jsdom has no ResizeObserver; this one reports on demand.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          observer.report = callback;
        }
        observe() {
          observer.report();
        }
        disconnect() {}
      },
    );
  });

  it("keeps the closed frame while the open search widens it", () => {
    const width = document.documentElement.clientWidth;
    frameAt(16, width - 16);
    const { result } = renderHook(() => useHeaderSlot());
    expect(result.current.frame).toMatchObject({ left: 16, right: 16 });

    const slot = document.getElementById(HEADER_SLOT_ID)!;
    slot.innerHTML = `<div ${HEADER_SLOT_OPEN_ATTR}></div>`;
    frameAt(0, width);
    act(() => observer.report());
    expect(result.current.frame).toMatchObject({ left: 16, right: 16 });

    slot.innerHTML = "<div></div>";
    frameAt(24, width - 24);
    act(() => observer.report());
    expect(result.current.frame).toMatchObject({ left: 24, right: 24 });
  });
});
