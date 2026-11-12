import { describe, expect, it, vi } from "vitest";

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

vi.mock("@/lib/cijene-api", () => ({
  default: {
    useGetProductByEan: () => ({ data: SUGAR, isLoading: false, error: null }),
    useGetPrices: () => ({
      data: { store_prices: [] },
      isLoading: false,
      error: null,
      dataUpdatedAt: 0,
    }),
  },
}));

// Geolocation is a boundary the suite cannot run; the stores order needs no origin.
vi.mock("@/hooks/use-distance-sort", () => ({
  useDistanceSort: () => ({ sortMode: "stores", distanceByChain: undefined }),
}));

describe("useProductDetail", () => {
  it("offline, leads with the saved profile's pinned chain", () => {
    const { result } = renderHookWithProviders(() =>
      useProductDetail(SUGAR.ean),
    );

    expect(result.current.sortedChains.map((item) => item.chain)).toEqual([
      "konzum",
      "spar",
    ]);
  });
});
