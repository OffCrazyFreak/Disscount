import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import useTabReentry from "@/hooks/state/use-tab-reentry";

const scrollWindowTo = vi.hoisted(() => vi.fn());

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/shopping-lists/1",
}));
vi.mock("@/utils/ui/scroll", () => ({ scrollWindowTo }));

function scrollTo(y: number) {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true });
}

describe("useTabReentry", () => {
  beforeEach(() => {
    scrollWindowTo.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns to the spot it left from", () => {
    const { result } = renderHook(() => useTabReentry());

    scrollTo(900);
    act(() => result.current.reenter());
    expect(scrollWindowTo).toHaveBeenLastCalledWith(0);
    expect(result.current.canReturn).toBe(true);

    scrollTo(0);
    act(() => result.current.reenter());
    expect(scrollWindowTo).toHaveBeenLastCalledWith(900);
    expect(result.current.canReturn).toBe(false);
  });

  it("keeps the first spot when a second tap lands mid-scroll", () => {
    const { result } = renderHook(() => useTabReentry());

    scrollTo(900);
    act(() => result.current.reenter());
    scrollTo(400);
    act(() => result.current.reenter());

    scrollTo(0);
    act(() => result.current.reenter());
    expect(scrollWindowTo).toHaveBeenLastCalledWith(900);
  });

  it("saves the new spot after the user scrolls down again", () => {
    const { result } = renderHook(() => useTabReentry());

    scrollTo(900);
    act(() => result.current.reenter());
    window.dispatchEvent(new Event("scrollend"));
    scrollTo(700);
    act(() => result.current.reenter());

    scrollTo(0);
    act(() => result.current.reenter());
    expect(scrollWindowTo).toHaveBeenLastCalledWith(700);
  });

  it("treats the scroll as settled after a fallback without scrollend", () => {
    const { result } = renderHook(() => useTabReentry());

    scrollTo(900);
    act(() => result.current.reenter());
    act(() => vi.advanceTimersByTime(2000));
    scrollTo(700);
    act(() => result.current.reenter());

    scrollTo(0);
    act(() => result.current.reenter());
    expect(scrollWindowTo).toHaveBeenLastCalledWith(700);
  });

  it("saves the return target when a tap lands during the trip back", () => {
    const { result } = renderHook(() => useTabReentry());

    scrollTo(900);
    act(() => result.current.reenter());
    window.dispatchEvent(new Event("scrollend"));
    scrollTo(0);
    act(() => result.current.reenter());
    scrollTo(450);
    act(() => result.current.reenter());

    scrollTo(0);
    window.dispatchEvent(new Event("scrollend"));
    act(() => result.current.reenter());
    expect(scrollWindowTo).toHaveBeenLastCalledWith(900);
  });

  it("does not let an older scroll's fallback end a newer scroll", () => {
    const { result } = renderHook(() => useTabReentry());

    scrollTo(900);
    act(() => result.current.reenter());
    window.dispatchEvent(new Event("scrollend"));
    act(() => vi.advanceTimersByTime(1000));

    scrollTo(800);
    act(() => result.current.reenter());
    // The first scroll's 1.5 s fallback fires here, during the second scroll.
    act(() => vi.advanceTimersByTime(600));
    scrollTo(300);
    act(() => result.current.reenter());

    scrollTo(0);
    window.dispatchEvent(new Event("scrollend"));
    act(() => result.current.reenter());
    expect(scrollWindowTo).toHaveBeenLastCalledWith(800);
  });
});
