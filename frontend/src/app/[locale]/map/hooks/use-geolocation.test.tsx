import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useGeolocation } from "@/app/[locale]/map/hooks/use-geolocation";

const ZAGREB = { lat: 45.81, lon: 15.98 };
const ERROR_CODES = {
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
};

// The browser API is a boundary the suite cannot run: each test decides when
// the watch answers and how.
function fakeGeolocation(permission: PermissionState = "prompt") {
  let success: PositionCallback = () => {};
  let failure: PositionErrorCallback = () => {};
  const watchPosition = vi.fn(
    (onSuccess: PositionCallback, onError: PositionErrorCallback) => {
      success = onSuccess;
      failure = onError;
      return 1;
    },
  );
  const clearWatch = vi.fn();

  const permissionStatus = {
    state: permission,
    onchange: null as (() => void) | null,
  };

  vi.stubGlobal("navigator", {
    geolocation: { watchPosition, clearWatch, getCurrentPosition: vi.fn() },
    permissions: { query: () => Promise.resolve(permissionStatus) },
  });

  return {
    watchPosition,
    clearWatch,
    revoke: () =>
      act(() => {
        permissionStatus.state = "denied";
        permissionStatus.onchange?.();
      }),
    fix: (lat: number, lon: number, accuracy = 20) =>
      act(() =>
        success({
          coords: { latitude: lat, longitude: lon, accuracy },
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

async function mount(fallback: typeof ZAGREB | null) {
  const hook = renderHook(() => useGeolocation(fallback));
  // Lets the permission query settle.
  await act(async () => {});
  return hook;
}

describe("useGeolocation", () => {
  beforeEach(() => vi.useFakeTimers());

  afterEach(() => {
    // Unmount first: the hook clears its watch on the stubbed navigator.
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("falls back to the IP guess when the phone gives no position", async () => {
    const geo = fakeGeolocation();
    const hook = await mount(ZAGREB);

    act(() => hook.result.current.locate());
    geo.fail(ERROR_CODES.POSITION_UNAVAILABLE);

    expect(hook.result.current.status).toBe("approximate");
    expect(hook.result.current.guess).toEqual(ZAGREB);
    expect(hook.result.current.position).toBeNull();
    expect(hook.result.current.centerRequest).toMatchObject({
      ...ZAGREB,
      radius: 10_000,
    });
  });

  it("reports the timeout when there is no IP guess either", async () => {
    fakeGeolocation();
    const hook = await mount(null);

    act(() => hook.result.current.locate());
    act(() => vi.advanceTimersByTime(15_000));

    expect(hook.result.current.status).toBe("timeout");
  });

  it("does not guess for someone who refused location", async () => {
    const geo = fakeGeolocation();
    const hook = await mount(ZAGREB);

    act(() => hook.result.current.locate());
    geo.fail(ERROR_CODES.PERMISSION_DENIED);

    expect(hook.result.current.status).toBe("denied");
    expect(hook.result.current.guess).toBeNull();
  });

  it("takes the guess back when the prompt is refused after the give-up timer", async () => {
    const geo = fakeGeolocation();
    const hook = await mount(ZAGREB);

    act(() => hook.result.current.locate());
    act(() => vi.advanceTimersByTime(15_000));
    expect(hook.result.current.status).toBe("approximate");

    geo.fail(ERROR_CODES.PERMISSION_DENIED);

    expect(hook.result.current.status).toBe("denied");
    expect(hook.result.current.guess).toBeNull();
    expect(hook.result.current.centerRequest).toBeNull();
  });

  it("guesses early when allowed but silent, then a real fix replaces the guess", async () => {
    const geo = fakeGeolocation("granted");
    const hook = await mount(ZAGREB);

    act(() => hook.result.current.locate());
    act(() => vi.advanceTimersByTime(1_500));
    expect(hook.result.current.status).toBe("approximate");

    geo.fix(45.4, 14.8);

    expect(hook.result.current.status).toBe("located");
    expect(hook.result.current.guess).toBeNull();
    expect(hook.result.current.centerRequest).toMatchObject({
      lat: 45.4,
      auto: false,
    });
  });

  it("watches from the start when allowed, so a tap moves without asking again", async () => {
    const geo = fakeGeolocation("granted");
    const hook = await mount(ZAGREB);

    geo.fix(45.4, 14.8);
    expect(hook.result.current.position).toMatchObject({ lat: 45.4 });
    expect(hook.result.current.centerRequest).toMatchObject({ auto: true });

    act(() => hook.result.current.locate());

    expect(hook.result.current.status).toBe("located");
    expect(hook.result.current.centerRequest).toMatchObject({
      lat: 45.4,
      auto: false,
    });
    expect(geo.watchPosition).toHaveBeenCalledTimes(1);
  });

  it("ignores jitter but follows a real move", async () => {
    const geo = fakeGeolocation("granted");
    const hook = await mount(ZAGREB);

    geo.fix(45.4, 14.8);
    const first = hook.result.current.position;

    geo.fix(45.4001, 14.8);
    expect(hook.result.current.position).toBe(first);

    geo.fix(45.41, 14.8);
    expect(hook.result.current.position).toMatchObject({ lat: 45.41 });
  });

  it("pauses the watch while the tab is hidden", async () => {
    const geo = fakeGeolocation("granted");
    await mount(ZAGREB);
    const hidden = vi.spyOn(document, "hidden", "get");

    hidden.mockReturnValue(true);
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(geo.clearWatch).toHaveBeenCalledTimes(1);

    hidden.mockReturnValue(false);
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(geo.watchPosition).toHaveBeenCalledTimes(2);
  });

  it("centres on a fix that comes after the give-up timer", async () => {
    const geo = fakeGeolocation();
    const hook = await mount(ZAGREB);

    act(() => hook.result.current.locate());
    act(() => vi.advanceTimersByTime(15_000));
    geo.fix(45.4, 14.8);

    expect(hook.result.current.status).toBe("located");
    expect(hook.result.current.centerRequest).toMatchObject({
      lat: 45.4,
      auto: true,
    });
  });

  it("centres again on the first fix after the tab comes back", async () => {
    const geo = fakeGeolocation("granted");
    const hook = await mount(ZAGREB);
    geo.fix(45.4, 14.8);
    const hidden = vi.spyOn(document, "hidden", "get");

    hidden.mockReturnValue(true);
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    hidden.mockReturnValue(false);
    act(() => document.dispatchEvent(new Event("visibilitychange")));

    act(() => hook.result.current.locate());
    expect(hook.result.current.centerRequest).toMatchObject({ lat: 45.4 });

    geo.fix(45.8, 15.9);
    expect(hook.result.current.centerRequest).toMatchObject({
      lat: 45.8,
      auto: false,
    });
  });

  it("restarts a watch that went silent when tapped again", async () => {
    const geo = fakeGeolocation("granted");
    const hook = await mount(null);

    geo.fail(ERROR_CODES.POSITION_UNAVAILABLE);
    act(() => hook.result.current.locate());

    expect(geo.clearWatch).toHaveBeenCalledTimes(1);
    expect(geo.watchPosition).toHaveBeenCalledTimes(2);
  });

  it("drops the dot when the permission is revoked", async () => {
    const geo = fakeGeolocation("granted");
    const hook = await mount(ZAGREB);
    geo.fix(45.4, 14.8);

    geo.revoke();

    expect(hook.result.current.position).toBeNull();
    expect(geo.clearWatch).toHaveBeenCalled();
  });
});
