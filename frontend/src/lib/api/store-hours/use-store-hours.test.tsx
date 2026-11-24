import { QueryClient } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw/http";
import { describe, expect, it } from "vitest";

import StoreHoursProvider from "@/components/custom/store-hours/store-hours-context";
import StoreOpeningBadge from "@/components/custom/store-hours/store-opening-badge";
import { useStoreHoursNow } from "@/components/custom/store-hours/use-store-hours-now";
import type { StoreHoursResponse } from "@/lib/api/schemas";
import { useStoreHours } from "@/lib/api/store-hours";
import { CIJENE_QUERY_KEYS } from "@/lib/cijene-api/keys";
import { encodeStoreHours } from "@/lib/store-hours/compact-store-hours";
import { server } from "@/test/msw-server";
import { renderHookWithProviders, renderWithProviders } from "@/test/render";

const VERIFIED = "2026-11-02T06:00:00.000Z";
const day = [{ opens: "07:00", closes: "21:00" }];

const hours: StoreHoursResponse = {
  stores: {
    "konzum:1": {
      weekly: [day, day, day, day, day, day, []],
      dated: [{ date: "2026-11-08", ranges: day, verifiedAt: VERIFIED }],
      sundays: "dated",
      source: "chain",
      verifiedAt: VERIFIED,
      checkUrl: null,
    },
  },
  holidays: [],
  generatedAt: VERIFIED,
};

function BadgeFromFetchedHours() {
  return (
    <StoreHoursProvider hours={useStoreHoursNow()}>
      <StoreOpeningBadge storeKey="ina:1" />
    </StoreHoursProvider>
  );
}

describe("useStoreHours", () => {
  it("drives a store's badge from the compact response", async () => {
    const allDay = [{ opens: "00:00", closes: "24:00" }];
    const verifiedAt = new Date().toISOString();

    server.use(
      http.get("*/api/cijene/store-hours", () =>
        HttpResponse.json(
          encodeStoreHours({
            stores: {
              "ina:1": {
                weekly: Array(7).fill(allDay),
                dated: [],
                sundays: "weekly",
                source: "chain",
                verifiedAt,
                checkUrl: null,
              },
            },
            holidays: [],
            generatedAt: verifiedAt,
          }),
        ),
      ),
    );

    renderWithProviders(<BadgeFromFetchedHours />);

    expect(await screen.findByText("Otvoreno")).toBeInTheDocument();
  });

  it("hands out full stores while the cache the persister saves stays compact", async () => {
    const compact = encodeStoreHours(hours);
    const queryClient = new QueryClient();

    server.use(
      http.get("*/api/cijene/store-hours", () => HttpResponse.json(compact)),
    );

    const { result } = renderHookWithProviders(() => useStoreHours(), {
      queryClient,
    });

    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(result.current.data).toStrictEqual(hours);
    expect(
      queryClient.getQueryData(CIJENE_QUERY_KEYS.storeHours),
    ).toStrictEqual(compact);
  });

  it("reports a response in any other shape as a failure", async () => {
    server.use(
      http.get("*/api/cijene/store-hours", () => HttpResponse.json(hours)),
    );

    const { result } = renderHookWithProviders(() => useStoreHours(), {
      queryClient: new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});
