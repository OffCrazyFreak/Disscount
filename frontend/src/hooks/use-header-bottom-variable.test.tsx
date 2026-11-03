import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  HEADER_BOTTOM_CHANGE_EVENT,
  useHeaderBottomVariable,
} from "@/hooks/use-header-bottom-variable";

let resize: () => void = () => {};

function stubResizeObserver() {
  vi.stubGlobal(
    "ResizeObserver",
    function FakeResizeObserver(callback: () => void) {
      resize = callback;

      return { observe: vi.fn(), disconnect: vi.fn() };
    },
  );
}

function mountHeader(bottom: { value: number }) {
  const header = document.createElement("nav");
  header.getBoundingClientRect = () => ({ bottom: bottom.value }) as DOMRect;
  document.body.append(header);

  return renderHook(() => useHeaderBottomVariable({ current: header }));
}

function published() {
  return document.documentElement.style.getPropertyValue("--header-bottom");
}

describe("useHeaderBottomVariable", () => {
  beforeEach(stubResizeObserver);

  it("publishes the header's bottom edge as soon as it mounts", () => {
    mountHeader({ value: 88.4 });

    expect(published()).toBe("88px");
  });

  it("announces only a change of whole pixels", () => {
    const bottom = { value: 80 };
    const onChange = vi.fn();
    window.addEventListener(HEADER_BOTTOM_CHANGE_EVENT, onChange);
    mountHeader(bottom);
    onChange.mockClear();

    bottom.value = 80.3;
    act(() => resize());
    expect(onChange).not.toHaveBeenCalled();

    bottom.value = 82;
    act(() => resize());
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(published()).toBe("82px");

    window.removeEventListener(HEADER_BOTTOM_CHANGE_EVENT, onChange);
  });

  it("hands the root back to the stylesheet fallback on unmount", () => {
    const { unmount } = mountHeader({ value: 80 });

    unmount();

    expect(published()).toBe("");
  });
});
