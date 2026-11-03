import { waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { http, HttpResponse } from "msw/http";
import { describe, expect, it, vi } from "vitest";

import { useWatchlistSuggestions } from "@/app/[locale]/(user)/watchlist/hooks/use-watchlist-suggestions";
import { CIJENE_QUERY_KEYS } from "@/lib/cijene-api/keys";
import { server } from "@/test/msw-server";
import { renderHookWithProviders } from "@/test/render";

const EAN = "3850104012345";

vi.mock("@/lib/api", () => ({
  shoppingListService: {
    useGetAllUserShoppingListItems: () => ({
      data: [{ ean: "3850104012345" }],
      isLoading: false,
    }),
  },
}));

const PRODUCT = {
  ean: EAN,
  brand: null,
  name: "Mlijeko",
  quantity: null,
  unit: null,
  chains: [],
};

describe("useWatchlistSuggestions", () => {
  it("keeps a cached suggestion's prices when its background refetch fails", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const key = CIJENE_QUERY_KEYS.productByEan(EAN);
    // Stale from the start, so mounting refetches it.
    queryClient.setQueryData(key, PRODUCT, { updatedAt: 0 });
    server.use(
      http.get("*/api/cijene/products/*", () =>
        HttpResponse.json({ error: "down" }, { status: 502 }),
      ),
    );

    const { result } = renderHookWithProviders(
      () =>
        useWatchlistSuggestions({
          query: "",
          watchedProductApiIds: new Set(),
          pinnedStoreChainCodes: [],
          hasPinnedStores: false,
          isAuthenticated: true,
        }),
      { queryClient },
    );

    await waitFor(() =>
      expect(queryClient.getQueryState(key)?.status).toBe("error"),
    );

    expect(result.current.filteredSuggestionItems[0].error).toBeNull();
    expect(result.current.filteredSuggestionItems[0].product).toEqual(PRODUCT);
  });
});
