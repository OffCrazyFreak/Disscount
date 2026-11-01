import { act, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw/http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useStoreOptimizeMode } from "@/app/[locale]/(user)/shopping-lists/[id]/hooks/use-store-optimize-mode";
import { server } from "@/test/msw-server";
import { renderHookWithProviders } from "@/test/render";
import {
  getStoreOptimizeMode,
  setStoreOptimizeMode,
} from "@/utils/browser/local-storage";

const konzum = {
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
};

// The browser APIs are a boundary the suite cannot run: each test decides
// what the permission query answers, and the position request never answers.
function fakeBrowser(permissions?: Permissions) {
  const getCurrentPosition = vi.fn();

  vi.stubGlobal("navigator", {
    ...navigator,
    geolocation: { getCurrentPosition },
    permissions,
  });

  return getCurrentPosition;
}

function answering(query: () => Promise<{ state: PermissionState }>) {
  return { query } as unknown as Permissions;
}

async function mount() {
  const hook = renderHookWithProviders(() => useStoreOptimizeMode());
  // Lets the permission query settle.
  await act(async () => {});
  return hook;
}

describe("useStoreOptimizeMode", () => {
  beforeEach(() => {
    server.use(
      http.get("*/api/cijene/store-directory", () =>
        HttpResponse.json({
          stores: [konzum],
          generatedAt: "2026-01-01T00:00:00Z",
        }),
      ),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it("restores distance when location is already granted", async () => {
    setStoreOptimizeMode("distance");
    const locate = fakeBrowser(
      answering(() => Promise.resolve({ state: "granted" })),
    );

    const { result } = await mount();

    expect(result.current.chosen).toBe("distance");
    expect(locate).toHaveBeenCalledOnce();
  });

  it.each([
    [
      "the permission is still a prompt",
      answering(() => Promise.resolve({ state: "prompt" })),
    ],
    ["the browser has no Permissions API", undefined],
    [
      "the browser rejects the geolocation name",
      answering(() => Promise.reject(new TypeError())),
    ],
  ])("opens in the default order when %s", async (_, permissions) => {
    setStoreOptimizeMode("distance");
    const locate = fakeBrowser(permissions);

    const { result } = await mount();

    expect(result.current.chosen).toBe("products");
    expect(locate).not.toHaveBeenCalled();
  });

  it("restores any other saved mode without asking", async () => {
    setStoreOptimizeMode("basket");
    const locate = fakeBrowser(
      answering(() => Promise.resolve({ state: "granted" })),
    );

    const { result } = await mount();

    expect(result.current.chosen).toBe("basket");
    expect(locate).not.toHaveBeenCalled();
  });

  it("saves a picked distance once it works", async () => {
    setStoreOptimizeMode("basket");
    const locate = fakeBrowser(
      answering(() => Promise.resolve({ state: "prompt" })),
    );
    const { result } = await mount();

    act(() => result.current.choose("distance"));
    expect(getStoreOptimizeMode()).toBe("basket");

    const [[success]] = locate.mock.calls as [[PositionCallback]];
    act(() =>
      success({
        coords: { latitude: 45.8, longitude: 16 },
      } as GeolocationPosition),
    );

    await waitFor(() => expect(getStoreOptimizeMode()).toBe("distance"));
  });

  it("keeps the earlier choice when a picked distance fails", async () => {
    setStoreOptimizeMode("basket");
    const locate = fakeBrowser(
      answering(() => Promise.resolve({ state: "prompt" })),
    );
    const { result } = await mount();

    act(() => result.current.choose("distance"));
    const [[, failure]] = locate.mock.calls as [
      [PositionCallback, PositionErrorCallback],
    ];
    act(() =>
      failure({
        code: 1,
        PERMISSION_DENIED: 1,
        TIMEOUT: 3,
      } as GeolocationPositionError),
    );

    expect(result.current.state).toBe("denied");
    expect(getStoreOptimizeMode()).toBe("basket");
  });

  it("forgets a saved distance whose restore fails", async () => {
    setStoreOptimizeMode("distance");
    const locate = fakeBrowser(
      answering(() => Promise.resolve({ state: "granted" })),
    );
    await mount();

    const [[, failure]] = locate.mock.calls as [
      [PositionCallback, PositionErrorCallback],
    ];
    act(() =>
      failure({
        code: 2,
        PERMISSION_DENIED: 1,
        TIMEOUT: 3,
      } as GeolocationPositionError),
    );

    expect(getStoreOptimizeMode()).toBe("products");
  });

  it("lets a pick made during the permission check win", async () => {
    setStoreOptimizeMode("distance");
    let grant: (status: { state: PermissionState }) => void = () => {};
    const locate = fakeBrowser(
      answering(() => new Promise((resolve) => (grant = resolve))),
    );
    const { result } = renderHookWithProviders(() => useStoreOptimizeMode());

    act(() => result.current.choose("basket"));
    await act(async () => grant({ state: "granted" }));

    expect(result.current.chosen).toBe("basket");
    expect(locate).not.toHaveBeenCalled();
  });
});
