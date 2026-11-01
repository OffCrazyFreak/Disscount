import { act, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { http, HttpResponse } from "msw/http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDistanceSort } from "@/hooks/use-distance-sort";
import type { StorePrice } from "@/lib/cijene-api/schemas";
import { server } from "@/test/msw-server";
import { renderHookWithProviders } from "@/test/render";

type Mode = "stores" | "price" | "distance";

function pricedAt(chain: string, code: string) {
  return {
    chain,
    ean: "1",
    price_date: "2026-01-01",
    regular_price: "1.00",
    special_price: null,
    unit_price: null,
    best_price_30: null,
    anchor_price: null,
    store: {
      chain_id: 1,
      code,
      type: null,
      address: null,
      city: null,
      zipcode: null,
      lat: null,
      lon: null,
      phone: null,
    },
  } satisfies StorePrice;
}

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

function mount(options?: Parameters<typeof useDistanceSort>[2]) {
  return renderHookWithProviders(() =>
    useDistanceSort<Mode>("stores", "stores", options),
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
    expect(result.current.distanceByChain?.get("konzum")).toBeCloseTo(1.4, 0);
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

  it("keeps locating until the product's prices are in", async () => {
    const geo = fakeGeolocation();
    let pricedStores: StorePrice[] | null = null;
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result, rerender } = renderHookWithProviders(
      () => useDistanceSort<Mode>("stores", "stores", { pricedStores }),
      { queryClient },
    );

    act(() => result.current.choose("distance"));
    geo.fix();
    // The store pins alone must not end the wait.
    await waitFor(() =>
      expect(
        queryClient.getQueryState(["cijene", "store-directory"])?.status,
      ).toBe("success"),
    );
    expect(result.current.state).toBe("locating");
    expect(result.current.sortMode).toBe("stores");

    pricedStores = [pricedAt("konzum", "1")];
    rerender();
    await waitFor(() => expect(result.current.state).toBe("ready"));
  });

  it("gives up with noStores when the product's prices failed", async () => {
    const geo = fakeGeolocation();
    const { result } = mount({ pricedStores: [] });

    act(() => result.current.choose("distance"));
    geo.fix();

    await waitFor(() => expect(result.current.state).toBe("noStores"));
  });

  it("gives up with noStores when no store has a pin", async () => {
    server.use(
      http.get("*/api/cijene/store-directory", () =>
        HttpResponse.json({
          ...directory,
          stores: [{ ...directory.stores[0], lat: null, lon: null }],
        }),
      ),
    );
    const geo = fakeGeolocation();
    const { result } = mount();

    act(() => result.current.choose("distance"));
    geo.fix();

    await waitFor(() => expect(result.current.state).toBe("noStores"));
    expect(result.current.chosen).toBe("stores");
    expect(result.current.distanceByChain).toBeUndefined();
  });

  it("fetches the store pins again when distance is picked after they failed", async () => {
    let calls = 0;
    server.use(
      http.get("*/api/cijene/store-directory", () => {
        calls++;
        return calls === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json(directory);
      }),
    );
    const geo = fakeGeolocation();
    const { result } = mount();

    act(() => result.current.choose("distance"));
    geo.fix();
    await waitFor(() => expect(result.current.state).toBe("noStores"));

    act(() => result.current.choose("distance"));
    geo.fix();

    await waitFor(() => expect(result.current.state).toBe("ready"));
    expect(calls).toBe(2);
  });
});
