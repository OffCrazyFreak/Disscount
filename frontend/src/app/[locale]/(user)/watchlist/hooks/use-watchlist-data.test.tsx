import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useWatchlistData } from "@/app/[locale]/(user)/watchlist/hooks/use-watchlist-data";
import type { ProductResponse } from "@/lib/cijene-api/schemas";

const PRODUCT: ProductResponse = {
  ean: "3850104012345",
  brand: null,
  name: "Mlijeko",
  quantity: "1",
  unit: "l",
  chains: [],
};

const products = vi.hoisted(() => ({
  queries: [] as { isLoading: boolean; data?: unknown; error: Error | null }[],
}));

vi.mock("@/context/user-context", () => ({
  useUser: () => ({ user: null, isAuthenticated: true, isLoading: false }),
}));

vi.mock("@/lib/watchlist/use-watched-products", () => ({
  useWatchedProducts: () => ({
    watchlistLoading: false,
    groupedWatchlistItems: [
      { productApiId: "3850104012345", watchlistItems: [] },
    ],
    pinnedStoreChainCodes: [],
    hasPinnedStores: false,
    productQueries: products.queries,
  }),
}));

vi.mock(
  "@/app/[locale]/(user)/watchlist/hooks/use-watchlist-suggestions",
  () => ({
    useWatchlistSuggestions: () => ({
      shoppingListItemsLoading: false,
      filteredSuggestionItems: [],
    }),
  }),
);

describe("useWatchlistData", () => {
  it("keeps cached prices when a background refetch fails", () => {
    products.queries = [
      { isLoading: false, data: PRODUCT, error: new Error("refetch failed") },
    ];

    const { result } = renderHook(() => useWatchlistData(""));

    expect(result.current.filteredItems[0].error).toBeNull();
    expect(result.current.filteredItems[0].product).toBe(PRODUCT);
  });

  it("reports the failure when there is nothing cached to show", () => {
    const failure = new Error("first load failed");
    products.queries = [{ isLoading: false, data: undefined, error: failure }];

    const { result } = renderHook(() => useWatchlistData(""));

    expect(result.current.filteredItems[0].error).toBe(failure);
  });
});
