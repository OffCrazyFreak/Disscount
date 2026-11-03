import { act } from "@testing-library/react";
import {
  QueryClient,
  dehydrate,
  hydrate,
  onlineManager,
  type MutationKey,
} from "@tanstack/react-query";
import { http, HttpResponse } from "msw/http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OFFLINE_MUTATION_KEYS } from "@/lib/offline/offline-mutation-keys";
import { registerOfflineMutationDefaults } from "@/lib/offline/offline-mutations";
import { persistOptions } from "@/lib/offline/persister";
import { setCacheIdentity } from "@/lib/offline/cache-identity";
import { actingAs, serverSession } from "@/test/backend-identity";
import { server } from "@/test/msw-server";

// Named .tsx only for the jsdom project: the API client sends the proxy headers only with a document.

const LIST_ID = "5b0e6c1a-7d2f-4e8a-9c3b-1f4d6a8e2c70";
const ITEM_ID = "0f3a9d52-6c1e-4b7a-8e2d-9a4c5b6d7e81";
const CARD_ID = "7c2e1b94-3a5d-4f6e-9b8c-1d2e3f4a5b6c";

function replayClient() {
  const queryClient = new QueryClient();
  registerOfflineMutationDefaults(
    queryClient,
    (key) => key,
    (key) => key,
  );
  return queryClient;
}

async function flushUntil(isDone: () => boolean) {
  for (let attempt = 0; attempt < 100 && !isDone(); attempt += 1) {
    await act(() => vi.advanceTimersByTimeAsync(500));
  }
  expect(isDone()).toBe(true);
}

/** Queues a write offline, then restores it into a fresh client, as a reload does. */
async function restoreQueuedWrite(
  mutationKey: MutationKey,
  variables: unknown,
) {
  onlineManager.setOnline(false);
  const before = replayClient();
  const queued = before.getMutationCache().build(before, { mutationKey });
  void queued.execute(variables);
  await flushUntil(() => queued.state.isPaused);

  const persisted = dehydrate(before, persistOptions.dehydrateOptions);
  // The tab that queued it is gone after a reload; only the persisted copy replays.
  before.getMutationCache().clear();

  const after = replayClient();
  hydrate(after, persisted);
  return after;
}

beforeEach(() => {
  vi.useFakeTimers();
  setCacheIdentity("user-a");
  serverSession.userId = "user-a";
});

afterEach(() => {
  vi.useRealTimers();
  onlineManager.setOnline(true);
});

describe("offline writes replayed after a reload", () => {
  it("ticks off an item as the account that queued it", async () => {
    const received: { account: string; body: unknown }[] = [];
    server.use(
      http.put(
        `*/api/shopping-lists/${LIST_ID}/items/${ITEM_ID}`,
        async ({ request }) => {
          received.push({
            account: actingAs(request),
            body: await request.json(),
          });
          return HttpResponse.json({});
        },
      ),
    );
    const data = { name: "Mlijeko", amount: 1, isChecked: true };
    const queryClient = await restoreQueuedWrite(
      OFFLINE_MUTATION_KEYS.shoppingListItemUpdate,
      { listId: LIST_ID, itemId: ITEM_ID, data },
    );

    onlineManager.setOnline(true);
    void queryClient.resumePausedMutations();

    await flushUntil(() => received.length > 0);
    expect(received).toEqual([{ account: "user-a", body: data }]);
  });

  it("keeps a card write through a 5xx and a 401 until it lands", async () => {
    const answers = [503, 401, 401];
    const received: { account: string; body: unknown }[] = [];
    server.use(
      http.put(`*/api/digital-cards/${CARD_ID}/pin`, async ({ request }) => {
        received.push({
          account: actingAs(request),
          body: await request.json(),
        });
        const status = answers.shift() ?? 204;
        return status === 204
          ? new HttpResponse(null, { status })
          : HttpResponse.json({ status }, { status });
      }),
    );
    const queryClient = await restoreQueuedWrite(
      OFFLINE_MUTATION_KEYS.digitalCardPin,
      { id: CARD_ID, pinned: true },
    );

    onlineManager.setOnline(true);
    void queryClient.resumePausedMutations();

    const [mutation] = queryClient.getMutationCache().getAll();
    await flushUntil(() => mutation.state.status === "success");
    expect(answers).toEqual([]);
    expect(received.at(-1)).toEqual({
      account: "user-a",
      body: { pinned: true },
    });
    expect(new Set(received.map(({ account }) => account))).toEqual(
      new Set(["user-a"]),
    );
  });
});
