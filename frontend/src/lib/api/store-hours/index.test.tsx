import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw/http";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { useStoreHours } from "@/lib/api/store-hours";
import { server } from "@/test/msw-server";

const EMPTY = {
  weeklyTemplates: [],
  baseDate: "2026-11-05",
  datedLists: [],
  verifiedTimes: [],
  checkUrls: [],
  stores: {},
  holidays: [],
  generatedAt: "2026-11-05T10:00:00.000Z",
};

const ONE_STORE = {
  ...EMPTY,
  weeklyTemplates: [[null, null, null, null, null, null, null]],
  datedLists: [[]],
  verifiedTimes: ["2026-11-05T09:00:00.000Z"],
  stores: { "konzum:1": [0, 0, 0, null, "chain", "weekly"] },
};

function serve(body: object) {
  const seen = { calls: 0 };
  server.use(
    http.get("*/api/cijene/store-hours", () => {
      seen.calls += 1;
      return HttpResponse.json(body);
    }),
  );
  return seen;
}

async function mountTwice() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  const first = renderHook(() => useStoreHours(), { wrapper });
  await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
  first.unmount();

  return renderHook(() => useStoreHours(), { wrapper });
}

describe("useStoreHours", () => {
  it("asks again on the next use when the first answer had no stores", async () => {
    const seen = serve(EMPTY);

    await mountTwice();

    await waitFor(() => expect(seen.calls).toBe(2));
  });

  it("keeps an answer with stores for the hour", async () => {
    const seen = serve(ONE_STORE);

    const second = await mountTwice();

    expect(second.result.current.fetchStatus).toBe("idle");
    expect(seen.calls).toBe(1);
  });
});
