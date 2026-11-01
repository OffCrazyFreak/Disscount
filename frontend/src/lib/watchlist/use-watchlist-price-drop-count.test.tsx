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

const session = vi.hoisted(() => ({ userId: "", pathname: "/" }));

// The session and the router are boundaries the suite cannot run.
vi.mock("@/context/user-context", () => ({
  useUser: () => ({
    isAuthenticated: true,
    user: { id: session.userId, pinnedStores: [] },
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
    count: useWatchlistPriceDropCount(),
    product: useQuery({
      queryKey: productByEanQueryKey(EAN),
      queryFn: skipToken,
    }).data,
  };
}

// Each test signs in as its own account, so no snapshot leaks between them.
function signIn(userId: string, pathname = "/") {
  session.userId = userId;
  session.pathname = pathname;
}

describe("useWatchlistPriceDropCount", () => {
  it("counts a watched product that got cheaper since the last visit", async () => {
    signIn("fell");
    setWatchlistPriceSnapshot("fell", { [EAN]: 129 });
    watching("0.99");

    const { result } = renderHookWithProviders(useWatchlistPriceDropCount);

    await waitFor(() => expect(result.current).toBe(1));
  });

  it("ignores a price that stayed the same or rose", async () => {
    signIn("rose");
    setWatchlistPriceSnapshot("rose", { [EAN]: 99 });
    watching("1.29");

    const { result } = renderHookWithProviders(useCountAndProduct);

    await waitFor(() => expect(result.current.product).toBeDefined());
    expect(result.current.count).toBe(0);
    expect(getWatchlistPriceSnapshot("rose")).toEqual({ [EAN]: 99 });
  });

  it("starts a new product's baseline at the first price it sees", async () => {
    signIn("new");
    watching("0.99");

    const { result } = renderHookWithProviders(useCountAndProduct);

    await waitFor(() =>
      expect(getWatchlistPriceSnapshot("new")).toEqual({ [EAN]: 99 }),
    );
    expect(result.current.count).toBe(0);
  });

  it("clears on the watchlist page and saves today's price as the baseline", async () => {
    signIn("visit", "/watchlist");
    setWatchlistPriceSnapshot("visit", { [EAN]: 129 });
    watching("0.99");

    const { result } = renderHookWithProviders(useCountAndProduct);

    await waitFor(() =>
      expect(getWatchlistPriceSnapshot("visit")).toEqual({ [EAN]: 99 }),
    );
    expect(result.current.count).toBe(0);
  });
});
