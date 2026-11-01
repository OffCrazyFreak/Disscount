import { skipToken, useQuery } from "@tanstack/react-query";
import { waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw/http";
import { describe, expect, it, vi } from "vitest";

import { productByEanQueryKey } from "@/lib/cijene-api";
import { useWatchlistPriceDropCount } from "@/lib/watchlist/use-watchlist-price-drop-count";
import { server } from "@/test/msw-server";
import { renderHookWithProviders } from "@/test/render";
import {
  getWatchlistPriceSnapshot,
  setWatchlistPriceSnapshot,
} from "@/utils/browser/storage/watchlist";

const session = vi.hoisted(() => ({
  userId: "",
  isAuthenticated: true,
  pathname: "/",
  pinnedStores: [] as { storeName: string }[] | undefined,
}));

// The session and the router are boundaries the suite cannot run.
vi.mock("@/context/user-context", () => ({
  useUser: () => ({
    isAuthenticated: session.isAuthenticated,
    user: session.isAuthenticated
      ? { id: session.userId, pinnedStores: session.pinnedStores }
      : null,
  }),
}));
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => session.pathname,
}));

const EAN = "3850102123456";

function watching(minPrice: string) {
  server.use(
    http.get("*/api/auth/token", () =>
      HttpResponse.json(null, { status: 401 }),
    ),
    http.get("*/api/watchlist/me", () =>
      HttpResponse.json([
        {
          id: "w1",
          userId: session.userId,
          productApiId: EAN,
          watchType: "PERCENTAGE",
          thresholdValue: 10,
          createdAt: "2026-10-01T00:00:00",
        },
      ]),
    ),
    http.get(`*/api/cijene/products/${EAN}`, () =>
      HttpResponse.json({
        ean: EAN,
        brand: null,
        name: "Mlijeko",
        quantity: null,
        unit: null,
        chains: [
          {
            chain: "lidl",
            code: "1",
            name: "Mlijeko",
            brand: null,
            category: null,
            unit: null,
            quantity: null,
            min_price: minPrice,
            max_price: minPrice,
            avg_price: minPrice,
            price_date: "2026-10-30",
          },
        ],
      }),
    ),
  );
}

// Observes the cached product without fetching it, so a zero is asserted only after the
// hook has seen the price rather than before it arrived.
function useCountAndProduct() {
  return {
    ...useWatchlistPriceDropCount(),
    product: useQuery({
      queryKey: productByEanQueryKey(EAN),
      queryFn: skipToken,
    }).data,
  };
}

// Each test signs in as its own account, so no snapshot leaks between them.
function signIn(userId: string, pathname = "/") {
  session.userId = userId;
  session.isAuthenticated = true;
  session.pathname = pathname;
  session.pinnedStores = [];
}

function saved(prices: Record<string, number>, scope = "") {
  return { scope, prices };
}

describe("useWatchlistPriceDropCount", () => {
  it("counts a watched product that got cheaper since the last visit", async () => {
    signIn("fell");
    setWatchlistPriceSnapshot("fell", saved({ [EAN]: 129 }));
    watching("0.99");

    const { result } = renderHookWithProviders(useCountAndProduct);

    await waitFor(() => expect(result.current.count).toBe(1));
  });

  it("agrees across several mounted surfaces", async () => {
    signIn("surfaces");
    setWatchlistPriceSnapshot("surfaces", saved({ [EAN]: 129 }));
    watching("0.99");

    const { result } = renderHookWithProviders(() => ({
      bar: useWatchlistPriceDropCount(),
      sidebar: useWatchlistPriceDropCount(),
    }));

    await waitFor(() => expect(result.current.bar.count).toBe(1));
    expect(result.current.sidebar.count).toBe(1);
    expect(getWatchlistPriceSnapshot("surfaces")).toEqual(
      saved({ [EAN]: 129 }),
    );
  });

  it("rebases instead of counting when the pinned stores change", async () => {
    signIn("rescoped");
    setWatchlistPriceSnapshot("rescoped", saved({ [EAN]: 249 }, "konzum"));
    watching("0.99");

    const { result } = renderHookWithProviders(useCountAndProduct);

    await waitFor(() =>
      expect(getWatchlistPriceSnapshot("rescoped")).toEqual(
        saved({ [EAN]: 99 }),
      ),
    );
    expect(result.current.count).toBe(0);
  });

  it("leaves another tab's disagreeing snapshot alone", async () => {
    signIn("tabs");
    watching("0.99");

    const { result } = renderHookWithProviders(useCountAndProduct);
    await waitFor(() => expect(result.current.isSettled).toBe(true));

    const otherTab = saved({ [EAN]: 129 }, "konzum");
    localStorage.setItem(
      "Disscount_app",
      JSON.stringify({ watchlistPriceSnapshots: { tabs: otherTab } }),
    );
    window.dispatchEvent(
      new StorageEvent("storage", { storageArea: localStorage }),
    );

    await waitFor(() =>
      expect(getWatchlistPriceSnapshot("tabs")).toEqual(otherTab),
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(JSON.parse(localStorage.getItem("Disscount_app")!)).toEqual({
      watchlistPriceSnapshots: { tabs: otherTab },
    });
  });

  it("keeps the baseline while the pinned stores failed to load", async () => {
    signIn("unknown");
    session.pinnedStores = undefined;
    setWatchlistPriceSnapshot("unknown", saved({ [EAN]: 249 }, "konzum"));
    watching("0.99");

    const { result } = renderHookWithProviders(useCountAndProduct);

    await waitFor(() => expect(result.current.product).toBeDefined());
    expect(result.current.isSettled).toBe(false);
    expect(getWatchlistPriceSnapshot("unknown")).toEqual(
      saved({ [EAN]: 249 }, "konzum"),
    );
  });

  it("is zero and never settles while signed out", () => {
    session.isAuthenticated = false;
    session.pathname = "/";

    const { result } = renderHookWithProviders(useWatchlistPriceDropCount);

    expect(result.current).toEqual({ count: 0, isSettled: false });
  });

  it("ignores a price that stayed the same or rose", async () => {
    signIn("rose");
    setWatchlistPriceSnapshot("rose", saved({ [EAN]: 99 }));
    watching("1.29");

    const { result } = renderHookWithProviders(useCountAndProduct);

    await waitFor(() => expect(result.current.product).toBeDefined());
    expect(result.current.count).toBe(0);
    expect(getWatchlistPriceSnapshot("rose")).toEqual(saved({ [EAN]: 99 }));
  });

  it("starts a new product's baseline at the first price it sees", async () => {
    signIn("new");
    watching("0.99");

    const { result } = renderHookWithProviders(useCountAndProduct);

    await waitFor(() =>
      expect(getWatchlistPriceSnapshot("new")).toEqual(saved({ [EAN]: 99 })),
    );
    expect(result.current.count).toBe(0);
  });

  it("clears on the watchlist page and saves today's price as the baseline", async () => {
    signIn("visit", "/watchlist");
    setWatchlistPriceSnapshot("visit", saved({ [EAN]: 129 }));
    watching("0.99");

    const { result } = renderHookWithProviders(useCountAndProduct);

    await waitFor(() =>
      expect(getWatchlistPriceSnapshot("visit")).toEqual(saved({ [EAN]: 99 })),
    );
    expect(result.current.count).toBe(0);
  });
});
