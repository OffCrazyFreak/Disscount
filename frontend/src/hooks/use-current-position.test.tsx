import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCurrentPosition } from "@/hooks/use-current-position";

const ERROR_CODES = {
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
};

// The browser API is a boundary the suite cannot run: each test decides when
// the one request answers and how.
function fakeGeolocation() {
  let success: PositionCallback = () => {};
  let failure: PositionErrorCallback = () => {};
  const getCurrentPosition = vi.fn(
    (onSuccess: PositionCallback, onError: PositionErrorCallback) => {
      success = onSuccess;
      failure = onError;
    },
  );

  vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });

  return {
    fix: () =>
      act(() =>
        success({
          coords: { latitude: 45.81, longitude: 15.98 },
        } as GeolocationPosition),
      ),
    fail: (code: number) =>
      act(() =>
        failure({
          ...ERROR_CODES,
          code,
          message: "",
        } as GeolocationPositionError),
      ),
  };
}

describe("useCurrentPosition", () => {
  beforeEach(() => vi.useFakeTimers());

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("answers with the fix", () => {
    const geo = fakeGeolocation();
    const { result } = renderHook(() => useCurrentPosition());

    act(() => result.current.request());
    expect(result.current.status).toBe("locating");

    geo.fix();
    expect(result.current.status).toBe("located");
    expect(result.current.position).toEqual({ lat: 45.81, lon: 15.98 });
  });

  it("waits out a slow permission prompt past the browser's fix timeout", () => {
    const geo = fakeGeolocation();
    const { result } = renderHook(() => useCurrentPosition());

    act(() => result.current.request());
    act(() => vi.advanceTimersByTime(30_000));
    expect(result.current.status).toBe("locating");

    geo.fix();
    expect(result.current.status).toBe("located");
  });

  it("drops a fix that lands after giving up", () => {
    const geo = fakeGeolocation();
    const { result } = renderHook(() => useCurrentPosition());

    act(() => result.current.request());
    act(() => vi.advanceTimersByTime(60_000));
    expect(result.current.status).toBe("unavailable");

    geo.fix();
    expect(result.current.status).toBe("unavailable");
    expect(result.current.position).toBeNull();
  });

  it("maps the browser's errors to statuses", () => {
    const geo = fakeGeolocation();
    const { result } = renderHook(() => useCurrentPosition());

    act(() => result.current.request());
    geo.fail(ERROR_CODES.TIMEOUT);
    expect(result.current.status).toBe("timeout");

    act(() => result.current.request());
    geo.fail(ERROR_CODES.PERMISSION_DENIED);
    expect(result.current.status).toBe("denied");
  });

  it("stops the give-up timer on unmount", () => {
    fakeGeolocation();
    const { result, unmount } = renderHook(() => useCurrentPosition());

    act(() => result.current.request());
    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
