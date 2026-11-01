import { act, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw/http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDistanceSort } from "@/app/[locale]/products/hooks/use-distance-sort";
import { server } from "@/test/msw-server";
import { renderHookWithProviders } from "@/test/render";
import type { ProductChainSortMode } from "@/app/[locale]/products/utils/product-chain-sort";

const DENIED = 1;
const ZAGREB = { latitude: 45.81, longitude: 15.98 };

const directory = {
  stores: [
    {
      chain: "konzum",
      code: "1",
      type: null,
      address: null,
      city: null,
      zipcode: null,
      phone: null,
      lat: 45.8,
      lon: 15.97,
      locationSource: "upstream",
    },
  ],
  generatedAt: "2026-01-01T00:00:00.000Z",
};

// The browser API is a boundary the suite cannot run: each test decides how
// the one request answers.
function fakeGeolocation() {
  let success: PositionCallback = () => {};
  let failure: PositionErrorCallback = () => {};
  const getCurrentPosition = vi.fn(
    (onSuccess: PositionCallback, onError: PositionErrorCallback) => {
      success = onSuccess;
      failure = onError;
    },
  );

  vi.stubGlobal("navigator", {
    ...navigator,
    geolocation: { getCurrentPosition },
  });

  return {
    getCurrentPosition,
    fix: () => act(() => success({ coords: ZAGREB } as GeolocationPosition)),
    deny: () =>
      act(() =>
        failure({
          code: DENIED,
          PERMISSION_DENIED: DENIED,
          TIMEOUT: 3,
          message: "",
        } as GeolocationPositionError),
      ),
  };
}

function mount() {
  return renderHookWithProviders(() =>
    useDistanceSort<ProductChainSortMode>("stores", "stores"),
  );
}

describe("useDistanceSort", () => {
  beforeEach(() => {
    server.use(
      http.get("*/api/cijene/store-directory", () =>
        HttpResponse.json(directory),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("asks for the location only when distance is picked", () => {
    const geo = fakeGeolocation();
    const { result } = mount();

    expect(geo.getCurrentPosition).not.toHaveBeenCalled();
    act(() => result.current.choose("distance"));
    expect(geo.getCurrentPosition).toHaveBeenCalledOnce();
  });

  it("keeps the fallback order until the location and stores are in", async () => {
    const geo = fakeGeolocation();
    const { result } = mount();

    act(() => result.current.choose("distance"));
    expect(result.current.state).toBe("locating");
    expect(result.current.sortMode).toBe("stores");

    geo.fix();
    await waitFor(() => expect(result.current.state).toBe("ready"));
    expect(result.current.sortMode).toBe("distance");
    expect(result.current.origin).toEqual({ lat: 45.81, lon: 15.98 });
    expect(result.current.stores).toHaveLength(1);
  });

  it("returns to the fallback with a reason when the location is denied", () => {
    const geo = fakeGeolocation();
    const { result } = mount();

    act(() => result.current.choose("distance"));
    geo.deny();

    expect(result.current.chosen).toBe("stores");
    expect(result.current.state).toBe("denied");

    act(() => result.current.choose("price"));
    expect(result.current.state).toBe("idle");
  });

  it("ignores a fix that lands after giving up", () => {
    vi.useFakeTimers();
    const geo = fakeGeolocation();
    const { result } = mount();

    act(() => result.current.choose("distance"));
    act(() => vi.advanceTimersByTime(15_000));
    expect(result.current.state).toBe("timeout");

    geo.fix();
    expect(result.current.chosen).toBe("stores");
    expect(result.current.state).toBe("timeout");
  });
});
