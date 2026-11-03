import { act } from "@testing-library/react";
import { QueryClient, useMutation } from "@tanstack/react-query";
import { http, HttpResponse } from "msw/http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useGetShoppingListById } from "@/lib/api/shopping-lists/hooks";
import { SHOPPING_LIST_QUERY_KEYS } from "@/lib/api/shopping-lists/keys";
import type { ShoppingListDto } from "@/lib/api/types";
import { OFFLINE_MUTATION_KEYS } from "@/lib/offline/offline-mutation-keys";
import { server } from "@/test/msw-server";
import { renderHookWithProviders } from "@/test/render";

const LIST_ID = "5b0e6c1a-7d2f-4e8a-9c3b-1f4d6a8e2c70";

// Signed out: the API client asks for a token first and sends the request without one.
function makeList(overrides: Partial<ShoppingListDto> = {}): ShoppingListDto {
  return {
    id: LIST_ID,
    title: "Tjedna kupnja",
    linkAccess: "SHOP",
    myAccess: "OWNER",
    updatedAt: "2026-11-01T10:00:00",
    createdAt: "2026-11-01T09:00:00",
    items: [],
    ...overrides,
  };
}

/** Serves `served.list` with `served.status` and counts how often the list was fetched. */
function serveList(list: ShoppingListDto) {
  const served = { list, requests: 0, status: 200 };
  server.use(
    http.get(`*/api/shopping-lists/${LIST_ID}`, () => {
      served.requests += 1;
      return served.status === 200
        ? HttpResponse.json(served.list)
        : // The backend answers errors with RFC 9457 Problem Details.
          HttpResponse.json(
            { status: served.status },
            { status: served.status },
          );
    }),
  );
  return served;
}

async function advance(ms: number) {
  await act(() => vi.advanceTimersByTimeAsync(ms));
}

// Testing Library's waitFor only recognises Jest's fake timers and hangs under Vitest's,
// so this flushes the pending request without moving the clock.
async function flushUntil(isDone: () => boolean) {
  for (let attempt = 0; attempt < 50 && !isDone(); attempt += 1) {
    await advance(0);
  }
  expect(isDone()).toBe(true);
}

async function renderLoadedList() {
  const view = renderHookWithProviders(() => useGetShoppingListById(LIST_ID));
  await flushUntil(() => view.result.current.isSuccess);
  return view;
}

describe("useGetShoppingListById polling", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date("2026-11-01T10:00:00Z") });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ["the owner's list shared by link", makeList()],
    [
      "a list reached through a link",
      makeList({ myAccess: "SHOP", linkAccess: null }),
    ],
  ])("polls %s every 5 seconds", async (_case, list) => {
    const served = serveList(list);
    await renderLoadedList();

    await advance(5_000);
    expect(served.requests).toBe(2);

    await advance(5_000);
    expect(served.requests).toBe(3);
  });

  it("does not poll a private list", async () => {
    const served = serveList(makeList({ linkAccess: "NONE" }));
    await renderLoadedList();

    await advance(60_000);
    expect(served.requests).toBe(1);
  });

  it("steps down to 30 seconds after two quiet minutes and back on a change", async () => {
    const served = serveList(makeList());
    await renderLoadedList();

    // The poll landing on the two minute mark is the first to see a quiet list.
    await advance(120_000);
    const requestsAfterTwoMinutes = served.requests;
    expect(requestsAfterTwoMinutes).toBe(1 + 24);

    await advance(29_000);
    expect(served.requests).toBe(requestsAfterTwoMinutes);

    served.list = makeList({ updatedAt: "2026-11-01T10:02:20" });
    await advance(1_000);
    expect(served.requests).toBe(requestsAfterTwoMinutes + 1);

    await advance(5_000);
    expect(served.requests).toBe(requestsAfterTwoMinutes + 2);
  });

  it("skips ticks while a shopping list write is pending", async () => {
    const served = serveList(makeList());
    let finishWrite = () => {};
    const { result } = renderHookWithProviders(() => ({
      list: useGetShoppingListById(LIST_ID),
      write: useMutation({
        mutationKey: OFFLINE_MUTATION_KEYS.shoppingListItemUpdate,
        mutationFn: () =>
          new Promise<void>((resolve) => {
            finishWrite = resolve;
          }),
      }),
    }));
    await flushUntil(() => result.current.list.isSuccess);

    act(() => result.current.write.mutate());
    await advance(15_000);
    expect(served.requests).toBe(1);

    await act(async () => finishWrite());
    await advance(5_000);
    expect(served.requests).toBe(2);
  });

  it("stops polling once the list is deleted or unshared", async () => {
    const served = serveList(makeList());
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const view = renderHookWithProviders(
      () => useGetShoppingListById(LIST_ID),
      { queryClient },
    );
    await flushUntil(() => view.result.current.isSuccess);

    served.status = 404;
    await advance(5_000);
    await flushUntil(
      () =>
        queryClient.getQueryState(SHOPPING_LIST_QUERY_KEYS.byId(LIST_ID))
          ?.status === "error",
    );

    await advance(60_000);
    expect(served.requests).toBe(2);
  });

  it("keeps polling every 30 seconds after any other error", async () => {
    const served = serveList(makeList());
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const view = renderHookWithProviders(
      () => useGetShoppingListById(LIST_ID),
      { queryClient },
    );
    await flushUntil(() => view.result.current.isSuccess);

    served.status = 503;
    await advance(5_000);
    await flushUntil(
      () =>
        queryClient.getQueryState(SHOPPING_LIST_QUERY_KEYS.byId(LIST_ID))
          ?.status === "error",
    );
    expect(served.requests).toBe(2);

    served.status = 200;
    await advance(29_000);
    expect(served.requests).toBe(2);
    await advance(1_000);
    expect(served.requests).toBe(3);
    await flushUntil(
      () =>
        queryClient.getQueryState(SHOPPING_LIST_QUERY_KEYS.byId(LIST_ID))
          ?.status === "success",
    );
    await advance(5_000);
    expect(served.requests).toBe(4);
  });
});
