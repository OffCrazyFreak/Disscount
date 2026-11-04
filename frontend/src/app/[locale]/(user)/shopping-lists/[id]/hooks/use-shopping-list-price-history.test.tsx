import { waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { http, HttpResponse } from "msw/http";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useShoppingListPriceHistory } from "@/app/[locale]/(user)/shopping-lists/[id]/hooks/use-shopping-list-price-history";
import { getPriceHistoryDates } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/price-history-series";
import type { ShoppingListDto } from "@/lib/api/types";
import { CIJENE_QUERY_KEYS } from "@/lib/cijene-api/keys";
import { server } from "@/test/msw-server";
import { renderHookWithProviders } from "@/test/render";
import { UNSET_ITEM_FIELDS } from "@/test/unset-item-fields";

vi.mock("@/context/user-context", () => ({
  useUser: () => ({ user: null }),
}));

const EAN = "3850104012345";

const LIST: ShoppingListDto = {
  id: "list-1",
  title: "Tjedni",
  ownerId: null,
  linkAccess: null,
  myAccess: "OWNER",
  createdAt: "2026-10-27T00:00:00",
  updatedAt: "2026-10-27T00:00:00",
  items: [
    {
      ...UNSET_ITEM_FIELDS,
      id: "milk",
      ean: EAN,
      name: "Mlijeko",
      amount: 1,
      isChecked: false,
      shoppingListId: "list-1",
      createdAt: "2026-10-27T00:00:00",
    },
  ],
};

const PRODUCT = {
  ean: EAN,
  brand: null,
  name: "Mlijeko",
  quantity: null,
  unit: null,
  chains: [],
};

afterEach(() => {
  vi.useRealTimers();
});

describe("useShoppingListPriceHistory", () => {
  it("moves the chart window to the new Zagreb day when a mounted tab crosses midnight", async () => {
    const requestedDates: string[] = [];
    server.use(
      http.get("*/api/cijene/products/*", ({ request }) => {
        requestedDates.push(
          new URL(request.url).searchParams.get("date") ?? "",
        );
        return HttpResponse.json(PRODUCT);
      }),
    );
    // Only Date is faked, so React Query and MSW keep their real timers.
    vi.useFakeTimers({
      toFake: ["Date"],
      now: new Date("2026-10-12T21:30:00Z"),
    });

    const { result, rerender } = renderHookWithProviders(
      () => useShoppingListPriceHistory(LIST, "1W"),
      {
        queryClient: new QueryClient({
          defaultOptions: { queries: { retry: false } },
        }),
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.chartData.at(-1)?.date).toBe("2026-10-12");

    vi.setSystemTime(new Date("2026-10-12T22:30:00Z"));
    rerender();

    await waitFor(() =>
      expect(result.current.chartData.at(-1)?.date).toBe("2026-10-13"),
    );
    expect(result.current.chartData[0].date).toBe("2026-10-07");
    expect(requestedDates).toContain("2026-10-13");
  });

  it("keeps the chart when a background refetch of cached history fails", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    // Stale from the start, so mounting refetches every day of the window.
    for (const date of getPriceHistoryDates(7)) {
      queryClient.setQueryData(
        CIJENE_QUERY_KEYS.priceHistory(EAN, date),
        PRODUCT,
        {
          updatedAt: 0,
        },
      );
    }
    server.use(
      http.get("*/api/cijene/products/*", () =>
        HttpResponse.json({ error: "down" }, { status: 502 }),
      ),
    );

    const { result } = renderHookWithProviders(
      () => useShoppingListPriceHistory(LIST, "1W"),
      { queryClient },
    );

    await waitFor(() =>
      expect(
        queryClient.getQueryCache().findAll({
          queryKey: CIJENE_QUERY_KEYS.priceHistory(
            EAN,
            getPriceHistoryDates(7)[0],
          ),
        })[0]?.state.status,
      ).toBe("error"),
    );

    expect(result.current.hasError).toBe(false);
  });
});
