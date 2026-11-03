import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCurrentMinute } from "@/hooks/use-current-minute";

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    value: state,
    configurable: true,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("useCurrentMinute", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-04T10:00:30Z"));
    setVisibility("visible");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("ticks on the minute boundary", () => {
    const { result } = renderHook(() => useCurrentMinute());

    expect(result.current?.toISOString()).toBe("2026-11-04T10:00:30.000Z");

    act(() => vi.advanceTimersByTime(30_000));

    expect(result.current?.toISOString()).toBe("2026-11-04T10:01:00.000Z");
  });

  it("pauses while hidden and catches up when shown", () => {
    const { result } = renderHook(() => useCurrentMinute());

    act(() => setVisibility("hidden"));
    act(() => vi.advanceTimersByTime(5 * 60_000));

    expect(result.current?.toISOString()).toBe("2026-11-04T10:00:30.000Z");

    act(() => setVisibility("visible"));

    expect(result.current?.toISOString()).toBe("2026-11-04T10:05:30.000Z");
  });
});
