import { waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { http, HttpResponse } from "msw/http";
import { describe, expect, it } from "vitest";

import { PRICE_ARCHIVE_START } from "@/constants/price-history";
import { usePriceHistory } from "@/lib/cijene-api/hooks";
import { CIJENE_QUERY_KEYS } from "@/lib/cijene-api/keys";
import { server } from "@/test/msw-server";
import { renderHookWithProviders } from "@/test/render";
import { buildDateWindow } from "@/utils/date";

const EAN = "3850104012345";

const PRODUCT = {
  ean: EAN,
  brand: null,
  name: "Mlijeko",
  quantity: null,
  unit: null,
  chains: [],
};

function failEveryDay() {
  server.use(
    http.get("*/api/cijene/products/*", () =>
      HttpResponse.json({ error: "down" }, { status: 502 }),
    ),
  );
}

function newQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe("usePriceHistory", () => {
  it("keeps the chart when a background refetch of cached history fails", async () => {
    const queryClient = newQueryClient();
    const dates = buildDateWindow(7, PRICE_ARCHIVE_START);
    // Stale from the start, so mounting refetches every day of the window.
    for (const date of dates) {
      queryClient.setQueryData(
        CIJENE_QUERY_KEYS.priceHistory(EAN, date),
        PRODUCT,
        { updatedAt: 0 },
      );
    }
    failEveryDay();

    const { result } = renderHookWithProviders(
      () => usePriceHistory({ ean: EAN, days: 7 }),
      { queryClient },
    );

    await waitFor(() =>
      expect(
        queryClient
          .getQueryCache()
          .find({ queryKey: CIJENE_QUERY_KEYS.priceHistory(EAN, dates[0]) })
          ?.state.status,
      ).toBe("error"),
    );

    expect(result.current.isError).toBe(false);
    expect(result.current.data).toHaveLength(dates.length);
  });

  it("hands the chart raw dates, which the chart formats per locale", () => {
    const queryClient = newQueryClient();
    const dates = buildDateWindow(7, PRICE_ARCHIVE_START);
    for (const date of dates) {
      queryClient.setQueryData(
        CIJENE_QUERY_KEYS.priceHistory(EAN, date),
        PRODUCT,
      );
    }

    const { result } = renderHookWithProviders(
      () => usePriceHistory({ ean: EAN, days: 7 }),
      { queryClient },
    );

    expect(result.current.data.map((row) => row.date)).toEqual(dates);
  });

  it("reports an error when a day has nothing cached to fall back on", async () => {
    failEveryDay();

    const { result } = renderHookWithProviders(
      () => usePriceHistory({ ean: EAN, days: 7 }),
      { queryClient: newQueryClient() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
