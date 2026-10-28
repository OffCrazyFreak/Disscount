import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useGeolocation } from "@/app/[locale]/map/hooks/use-geolocation";

const ZAGREB = { lat: 45.81, lon: 15.98 };
const ERROR_CODES = {
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
};

// The browser API is a boundary the suite cannot run: each test decides how it fails.
function failWith(code: number) {
  vi.stubGlobal("navigator", {
    geolocation: {
      getCurrentPosition: (
        _success: PositionCallback,
        error: PositionErrorCallback,
      ) =>
        error({
          ...ERROR_CODES,
          code,
          message: "",
        } as GeolocationPositionError),
    },
  });
}

function tapNearMe(fallback: typeof ZAGREB | null) {
  const hook = renderHook(() => useGeolocation(fallback));
  act(() => hook.result.current.locate());
  return hook.result.current;
}

describe("useGeolocation", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("falls back to the IP guess when the phone gives no position", () => {
    failWith(ERROR_CODES.TIMEOUT);

    const result = tapNearMe(ZAGREB);

    expect(result.status).toBe("approximate");
    expect(result.guess).toEqual(ZAGREB);
    expect(result.position).toBeNull();
    expect(result.centerRequest).toMatchObject({ ...ZAGREB, zoom: 11 });
  });

  it("reports the timeout when there is no IP guess either", () => {
    failWith(ERROR_CODES.TIMEOUT);

    expect(tapNearMe(null).status).toBe("timeout");
  });

  it("does not guess for someone who refused location", () => {
    failWith(ERROR_CODES.PERMISSION_DENIED);

    const result = tapNearMe(ZAGREB);

    expect(result.status).toBe("denied");
    expect(result.guess).toBeNull();
  });

  it("takes the guess back when the prompt is refused after the give-up timer", () => {
    vi.useFakeTimers();
    let refuse = () => {};
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: (
          _success: PositionCallback,
          error: PositionErrorCallback,
        ) => {
          refuse = () =>
            error({
              ...ERROR_CODES,
              code: ERROR_CODES.PERMISSION_DENIED,
              message: "",
            } as GeolocationPositionError);
        },
      },
    });
    const hook = renderHook(() => useGeolocation(ZAGREB));

    act(() => hook.result.current.locate());
    act(() => vi.advanceTimersByTime(15_000));
    expect(hook.result.current.status).toBe("approximate");

    act(() => refuse());

    expect(hook.result.current.status).toBe("denied");
    expect(hook.result.current.guess).toBeNull();
    vi.useRealTimers();
  });
});
