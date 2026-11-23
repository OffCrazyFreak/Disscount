import { beforeEach, describe, expect, it, vi } from "vitest";

import { useProductDetail } from "@/app/[locale]/products/[id]/hooks/use-product-detail";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { renderHookWithProviders } from "@/test/render";
import { chain } from "@/test/price-fixtures";

const SUGAR: ProductResponse = {
  ean: "3850104004421",
  brand: "Viro",
  name: "Šećer 1 kg",
  quantity: "1",
  unit: "kg",
  chains: [chain("spar", 1.2), chain("konzum", 1.4)],
};

// Offline: the session check failed, so only the saved profile names the pinned stores.
vi.mock("@/context/user-context", () => ({
  useUser: () => ({
    user: null,
    accountUser: {
      pinnedStores: [{ storeApiId: "konzum", storeName: "Konzum Ilica" }],
    },
  }),
}));

const prices = vi.hoisted(() => ({
  data: { store_prices: [] } as { store_prices: never[] } | undefined,
  fetchStatus: "idle" as "idle" | "fetching" | "paused",
}));

vi.mock("@/lib/cijene-api", () => ({
  default: {
    useGetProductByEan: () => ({ data: SUGAR, isLoading: false, error: null }),
    useGetPrices: () => ({
      data: prices.data,
      isLoading: false,
      error: null,
      dataUpdatedAt: 0,
      fetchStatus: prices.fetchStatus,
    }),
  },
}));

// Geolocation is a boundary the suite cannot run; the stores order needs no origin.
vi.mock("@/hooks/use-distance-sort", () => ({
  useDistanceSort: () => ({ sortMode: "stores", distanceByChain: undefined }),
}));

describe("useProductDetail", () => {
  beforeEach(() => {
    prices.data = { store_prices: [] };
    prices.fetchStatus = "idle";
  });

  it("offline, leads with the saved profile's pinned chain", () => {
    const { result } = renderHookWithProviders(() =>
      useProductDetail(SUGAR.ean),
    );

    expect(result.current.sortedChains.map((item) => item.chain)).toEqual([
      "konzum",
      "spar",
    ]);
  });

  it("offline with no saved prices, says so instead of reporting no stores", () => {
    prices.data = undefined;
    prices.fetchStatus = "paused";

    const { result } = renderHookWithProviders(() =>
      useProductDetail(SUGAR.ean),
    );

    expect(result.current.pricesOffline).toBe(true);
  });

  it("offline with saved prices, keeps showing them", () => {
    prices.fetchStatus = "paused";

    const { result } = renderHookWithProviders(() =>
      useProductDetail(SUGAR.ean),
    );

    expect(result.current.pricesOffline).toBe(false);
  });
});
