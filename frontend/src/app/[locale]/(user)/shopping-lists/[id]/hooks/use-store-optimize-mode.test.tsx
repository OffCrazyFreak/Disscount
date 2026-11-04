import { act, cleanup, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw/http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDistanceOrigin } from "@/hooks/use-distance-origin";
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
const spar = { ...konzum, chain: "spar", city: "Split", zipcode: "21000" };

let user: { pinnedPlaces?: { placeApiId: string }[] } | null = null;
let isLoading = false;
vi.mock("@/context/user-context", () => ({
  useUser: () => ({ accountUser: user, isLoading }),
}));

// The browser APIs are a boundary the suite cannot run, so each test decides the permission answer and the position watch never answers.
function fakeBrowser(permissions?: Permissions) {
  const watchPosition = vi.fn(() => 1);

  vi.stubGlobal("navigator", {
    ...navigator,
    geolocation: {
      watchPosition,
      clearWatch: vi.fn(),
      getCurrentPosition: vi.fn(),
    },
    permissions,
  });

  return watchPosition;
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
          stores: [konzum, spar],
          generatedAt: "2026-01-01T00:00:00Z",
        }),
      ),
    );
  });

  afterEach(() => {
    // Unmount first: the hook clears its watch on the stubbed navigator.
    cleanup();
    user = null;
    isLoading = false;
    renderHookWithProviders(() =>
      useDistanceOrigin(undefined, null),
    ).result.current.pickTown(null);
    vi.unstubAllGlobals();
  });

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

  it("restores distance from the saved place without asking", async () => {
    setStoreOptimizeMode("distance");
    user = { pinnedPlaces: [{ placeApiId: "Split" }] };
    const locate = fakeBrowser(
      answering(() => Promise.resolve({ state: "prompt" })),
    );

    const { result } = await mount();

    await waitFor(() => expect(result.current.state).toBe("ready"));
    expect(result.current.origin).toMatchObject({ source: "saved" });
    expect(locate).not.toHaveBeenCalled();
  });

  it("waits for the profile before restoring from the saved place", async () => {
    setStoreOptimizeMode("distance");
    isLoading = true;
    fakeBrowser(answering(() => Promise.resolve({ state: "prompt" })));
    const { result, rerender } = await mount();

    user = { pinnedPlaces: [{ placeApiId: "Split" }] };
    isLoading = false;
    rerender();

    await waitFor(() => expect(result.current.state).toBe("ready"));
    expect(result.current.origin).toMatchObject({ source: "saved" });
  });

  it("restores distance from this session's town without asking", async () => {
    setStoreOptimizeMode("distance");
    renderHookWithProviders(() =>
      useDistanceOrigin(undefined, null),
    ).result.current.pickTown("Split");
    const locate = fakeBrowser(undefined);

    const { result } = await mount();

    await waitFor(() => expect(result.current.state).toBe("ready"));
    expect(result.current.origin).toMatchObject({ source: "picked" });
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

    const [[success]] = locate.mock.calls as unknown as [[PositionCallback]];
    act(() =>
      success({
        coords: { latitude: 45.8, longitude: 16, accuracy: 20 },
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
    const [[, failure]] = locate.mock.calls as unknown as [
      [PositionCallback, PositionErrorCallback],
    ];
    act(() =>
      failure({
        code: 1,
        PERMISSION_DENIED: 1,
        TIMEOUT: 3,
      } as GeolocationPositionError),
    );

    await waitFor(() => expect(result.current.state).toBe("denied"));
    expect(getStoreOptimizeMode()).toBe("basket");
  });

  it("forgets a saved distance whose restore fails", async () => {
    setStoreOptimizeMode("distance");
    const locate = fakeBrowser(
      answering(() => Promise.resolve({ state: "granted" })),
    );
    await mount();

    const [[, failure]] = locate.mock.calls as unknown as [
      [PositionCallback, PositionErrorCallback],
    ];
    act(() =>
      failure({
        code: 2,
        PERMISSION_DENIED: 1,
        TIMEOUT: 3,
      } as GeolocationPositionError),
    );

    await waitFor(() => expect(getStoreOptimizeMode()).toBe("products"));
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
