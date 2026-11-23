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
  chains: [chain("spar", "1.20"), chain("konzum", "1.40")],
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

type QueryStatus = "pending" | "error" | "success";
type FetchStatus = "idle" | "fetching" | "paused";

const productQuery = vi.hoisted(() => ({
  status: "success" as QueryStatus,
  fetchStatus: "idle" as FetchStatus,
}));

const prices = vi.hoisted(() => ({
  data: { store_prices: [] } as { store_prices: never[] } | undefined,
  fetchStatus: "idle" as "idle" | "fetching" | "paused",
}));

vi.mock("@/lib/cijene-api", () => ({
  default: {
    useGetProductByEan: () => ({
      data: productQuery.status === "success" ? SUGAR : undefined,
      isLoading: false,
      error: null,
      status: productQuery.status,
      fetchStatus: productQuery.fetchStatus,
    }),
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
    productQuery.status = "success";
    productQuery.fetchStatus = "idle";
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

  it.each<[QueryStatus, FetchStatus, boolean]>([
    ["pending", "paused", true],
    ["pending", "fetching", false],
    ["error", "paused", false],
    ["success", "paused", false],
  ])(
    "with the product %s and its request %s, reports offline as %s",
    (status, fetchStatus, offline) => {
      productQuery.status = status;
      productQuery.fetchStatus = fetchStatus;

      const { result } = renderHookWithProviders(() =>
        useProductDetail(SUGAR.ean),
      );

      expect(result.current.productOffline).toBe(offline);
    },
  );
});
