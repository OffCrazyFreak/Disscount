import { act, waitFor } from "@testing-library/react";
import {
  focusManager,
  onlineManager,
  QueryClient,
} from "@tanstack/react-query";
import { http, HttpResponse } from "msw/http";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useShoppingListData } from "@/app/[locale]/(user)/shopping-lists/[id]/hooks/use-shopping-list-data";
import { useStoreChainAnalysis } from "@/app/[locale]/(user)/shopping-lists/[id]/hooks/use-store-chain-analysis";
import { SHOPPING_LIST_QUERY_KEYS } from "@/lib/api/shopping-lists/keys";
import { productByEanQueryKey } from "@/lib/cijene-api";
import type { ShoppingListDto, ShoppingListItemDto } from "@/lib/api/types";
import { server } from "@/test/msw-server";
import { renderHookWithProviders } from "@/test/render";

vi.mock("@/context/user-context", () => ({
  useUser: () => ({ user: null }),
}));

const LIST_ID = "list-1";

function item(id: string, ean: string): ShoppingListItemDto {
  return {
    id,
    ean,
    name: id,
    amount: 1,
    isChecked: false,
    shoppingListId: LIST_ID,
    createdAt: "2026-10-27T00:00:00",
  };
}

const list: ShoppingListDto = {
  id: LIST_ID,
  title: "Tjedni",
  myAccess: "OWNER",
  createdAt: "2026-10-27T00:00:00",
  updatedAt: "2026-10-27T00:00:00",
  items: [
    item("priced", "111"),
    item("broken", "222"),
    item("unknown", "333"),
    { ...item("bought", "222"), isChecked: true },
  ],
};

function product(ean: string) {
  return {
    ean,
    brand: null,
    name: "Mlijeko",
    quantity: null,
    unit: null,
    chains: [
      {
        chain: "konzum",
        code: "1",
        name: "Mlijeko",
        brand: null,
        category: null,
        unit: null,
        quantity: null,
        min_price: "1.00",
        max_price: "1.20",
        avg_price: "1.10",
        price_date: "2026-10-27",
      },
    ],
  };
}

// The app's own retry policy, with no backoff, so a retry shows up as a second request.
function appLikeQueryClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: 1, retryDelay: 0 } },
  });
  client.setQueryData(SHOPPING_LIST_QUERY_KEYS.byId(LIST_ID), list);
  return client;
}

function answerProducts(requests: string[], brokenStatus = 502) {
  server.use(
    http.get("*/api/cijene/products/:ean", ({ params }) => {
      const ean = String(params.ean);
      requests.push(ean);
      if (ean === "222") {
        return HttpResponse.json({ error: "x" }, { status: brokenStatus });
      }
      if (ean === "333") {
        return HttpResponse.json({ error: "x" }, { status: 404 });
      }
      return HttpResponse.json(product(ean));
    }),
  );
}

afterEach(() => {
  onlineManager.setOnline(true);
  focusManager.setFocused(undefined);
});

describe("useShoppingListData price states", () => {
  it("tells loading, failed and missing prices apart per item", async () => {
    const requests: string[] = [];
    answerProducts(requests);

    const { result } = renderHookWithProviders(
      () => useShoppingListData(LIST_ID),
      { queryClient: appLikeQueryClient() },
    );

    expect(result.current.priceStates.priced).toBe("loading");

    await waitFor(() =>
      expect(result.current.priceStates).toEqual({
        priced: "ready",
        broken: "failed",
        unknown: "noPrices",
        // Bought items show the prices saved with them, not the live lookup.
        bought: "ready",
      }),
    );

    // A 404 means upstream does not carry the EAN, so it is asked once; a 502 gets its retry.
    expect(requests.filter((ean) => ean === "333")).toHaveLength(1);
    expect(requests.filter((ean) => ean === "222")).toHaveLength(2);
  });

  it("gives a plain item no lookup and no price state", async () => {
    const requests: string[] = [];
    answerProducts(requests);
    const client = appLikeQueryClient();
    client.setQueryData(SHOPPING_LIST_QUERY_KEYS.byId(LIST_ID), {
      ...list,
      items: [item("priced", "111"), { ...item("jars", "x"), ean: null }],
    });

    const { result } = renderHookWithProviders(
      () => useShoppingListData(LIST_ID),
      { queryClient: client },
    );

    await waitFor(() =>
      expect(result.current.priceStates).toEqual({ priced: "ready" }),
    );
    expect(requests).toEqual(["111"]);
  });

  it("retries only the failed EANs and keeps them failed meanwhile", async () => {
    const requests: string[] = [];
    answerProducts(requests);

    const { result } = renderHookWithProviders(
      () => useShoppingListData(LIST_ID),
      { queryClient: appLikeQueryClient() },
    );

    await waitFor(() =>
      expect(result.current.priceStates.broken).toBe("failed"),
    );

    let answerRetry = () => {};
    const retried: string[] = [];
    server.use(
      http.get("*/api/cijene/products/:ean", async ({ params }) => {
        retried.push(String(params.ean));
        await new Promise<void>((resolve) => (answerRetry = resolve));
        return HttpResponse.json(product(String(params.ean)));
      }),
    );

    let retryLoadedAll: Promise<boolean> | undefined;
    act(() => {
      retryLoadedAll = result.current.retryFailedPrices();
    });

    await waitFor(() => expect(result.current.isRetryingPrices).toBe(true));
    // answerRetry is a no-op until the request reaches the handler.
    await waitFor(() => expect(retried).toEqual(["222"]));
    expect(result.current.priceStates.broken).toBe("failed");
    // The list would otherwise ungroup and blank its totals for the length of the retry.
    expect(result.current.isPricesLoading).toBe(false);

    act(() => answerRetry());

    await waitFor(() =>
      expect(result.current.priceStates.broken).toBe("ready"),
    );
    expect(result.current.isRetryingPrices).toBe(false);
    expect(retried).toEqual(["222"]);
    await expect(retryLoadedAll).resolves.toBe(true);
  });

  it("keeps a failed item failed while a window focus refetch runs", async () => {
    const requests: string[] = [];
    answerProducts(requests);

    // The store summary watches the same lookups on this page, and TanStack refetches
    // through whichever observer allows it.
    const { result } = renderHookWithProviders(
      () => {
        useStoreChainAnalysis({
          shoppingList: list,
          pinnedStores: null,
          optimizeBy: "total",
        });
        return useShoppingListData(LIST_ID);
      },
      { queryClient: appLikeQueryClient() },
    );

    await waitFor(() =>
      expect(result.current.priceStates.broken).toBe("failed"),
    );
    requests.length = 0;

    let refetching = false;
    server.use(
      http.get("*/api/cijene/products/:ean", async ({ params }) => {
        requests.push(String(params.ean));
        if (params.ean === "222") refetching = true;
        await new Promise(() => {});
        return HttpResponse.json(null);
      }),
    );

    act(() => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
    });

    await waitFor(() => expect(refetching).toBe(true));
    // The 404 is known and stays out of every refetch.
    expect(requests).toEqual(["222"]);
    await waitFor(() => expect(result.current.isRetryingPrices).toBe(true));
    expect(result.current.priceStates.broken).toBe("failed");
    expect(result.current.isPricesLoading).toBe(false);
  });

  it("keeps a 404 as no prices while another screen refetches it", async () => {
    const requests: string[] = [];
    answerProducts(requests);
    const queryClient = appLikeQueryClient();

    const { result } = renderHookWithProviders(
      () => useShoppingListData(LIST_ID),
      { queryClient },
    );

    await waitFor(() =>
      expect(result.current.priceStates.unknown).toBe("noPrices"),
    );

    let refetching = false;
    server.use(
      http.get("*/api/cijene/products/:ean", async () => {
        refetching = true;
        await new Promise(() => {});
        return HttpResponse.json(null);
      }),
    );

    // The watchlist and product modal observe the same key with the default options.
    act(() => {
      void queryClient.refetchQueries({
        queryKey: productByEanQueryKey("333"),
      });
    });

    await waitFor(() => expect(refetching).toBe(true));
    await waitFor(() =>
      expect(
        queryClient.getQueryState(productByEanQueryKey("333"))?.fetchStatus,
      ).toBe("fetching"),
    );
    expect(result.current.priceStates.unknown).toBe("noPrices");
    expect(result.current.priceStates.broken).toBe("failed");
  });

  it("keeps a failed item failed when its retry pauses offline", async () => {
    const requests: string[] = [];
    answerProducts(requests);

    const queryClient = appLikeQueryClient();
    const { result } = renderHookWithProviders(
      () => useShoppingListData(LIST_ID),
      { queryClient },
    );

    await waitFor(() =>
      expect(result.current.priceStates.broken).toBe("failed"),
    );

    act(() => {
      onlineManager.setOnline(false);
      void result.current.retryFailedPrices();
    });

    await waitFor(() =>
      expect(
        queryClient.getQueryState(productByEanQueryKey("222"))?.fetchStatus,
      ).toBe("paused"),
    );
    expect(result.current.priceStates.broken).toBe("failed");
    // Nothing is in flight, so the button does not spin until the connection returns.
    expect(result.current.isRetryingPrices).toBe(false);
  });

  it("keeps the store summary out of loading while a retry runs", async () => {
    const requests: string[] = [];
    answerProducts(requests);

    const { result } = renderHookWithProviders(
      () => ({
        summary: useStoreChainAnalysis({
          shoppingList: list,
          pinnedStores: null,
          optimizeBy: "total",
        }),
        data: useShoppingListData(LIST_ID),
      }),
      { queryClient: appLikeQueryClient() },
    );

    await waitFor(() =>
      expect(result.current.data.priceStates.broken).toBe("failed"),
    );

    server.use(
      http.get("*/api/cijene/products/:ean", async () => {
        await new Promise(() => {});
        return HttpResponse.json(null);
      }),
    );
    act(() => {
      void result.current.data.retryFailedPrices();
    });

    await waitFor(() =>
      expect(result.current.data.isRetryingPrices).toBe(true),
    );
    expect(result.current.summary.productsLoading).toBe(false);
  });

  it("reports prices that were never saved while offline", () => {
    onlineManager.setOnline(false);

    const { result } = renderHookWithProviders(
      () => useShoppingListData(LIST_ID),
      { queryClient: appLikeQueryClient() },
    );

    expect(result.current.priceStates).toEqual({
      priced: "offline",
      broken: "offline",
      unknown: "offline",
      bought: "ready",
    });
  });
});
