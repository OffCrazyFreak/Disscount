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

import { toast } from "sonner";

import { dropExpiredWrites } from "@/lib/offline/drop-expired-writes";
import { OFFLINE_MUTATION_KEYS } from "@/lib/offline/offline-mutation-keys";
import { registerOfflineMutationDefaults } from "@/lib/offline/offline-mutations";
import { persistOptions } from "@/lib/offline/persister";
import { setCacheIdentity } from "@/lib/offline/cache-identity";
import { actingAs, serverSession } from "@/test/backend-identity";
import { server } from "@/test/msw-server";

// Named .tsx only for the jsdom project: the API client sends the proxy headers only with a document.

const disk = vi.hoisted(() => new Map<string, unknown>());
vi.mock("idb-keyval", () => ({
  get: async (key: string) => disk.get(key),
  set: async (key: string, value: unknown) => void disk.set(key, value),
  del: async (key: string) => void disk.delete(key),
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

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

/** Saves the cache through the real persister and restores it into a fresh client. */
async function reloadThroughDisk(before: QueryClient) {
  void persistOptions.persister.persistClient({
    timestamp: Date.now(),
    buster: persistOptions.buster ?? "",
    clientState: dehydrate(before, persistOptions.dehydrateOptions),
  });
  // Past the persister's save throttle.
  await act(() => vi.advanceTimersByTimeAsync(1500));
  before.getMutationCache().clear();

  const restored = await persistOptions.persister.restoreClient();
  const after = replayClient();
  if (restored) hydrate(after, restored.clientState);
  return after;
}

beforeEach(() => {
  disk.clear();
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

  it("resumes a card write that was still retrying when the page closed", async () => {
    let attempts = 0;
    server.use(
      http.put(`*/api/digital-cards/${CARD_ID}/pin`, () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.json({ status: 503 }, { status: 503 })
          : new HttpResponse(null, { status: 204 });
      }),
    );
    const before = replayClient();
    const retrying = before
      .getMutationCache()
      .build(before, { mutationKey: OFFLINE_MUTATION_KEYS.digitalCardPin });
    void retrying.execute({ id: CARD_ID, pinned: true }).catch(() => undefined);
    await flushUntil(() => retrying.state.failureCount === 1);
    expect(retrying.state.isPaused).toBe(false);

    const after = await reloadThroughDisk(before);
    void after.resumePausedMutations();

    const [restored] = after.getMutationCache().getAll();
    await flushUntil(() => restored?.state.status === "success");
  });

  it("gives up on a replayed card write the server keeps refusing", async () => {
    let attempts = 0;
    server.use(
      http.put(`*/api/digital-cards/${CARD_ID}/pin`, () => {
        attempts += 1;
        return HttpResponse.json({ status: 503 }, { status: 503 });
      }),
    );
    const queryClient = await restoreQueuedWrite(
      OFFLINE_MUTATION_KEYS.digitalCardPin,
      { id: CARD_ID, pinned: true },
    );

    onlineManager.setOnline(true);
    void queryClient.resumePausedMutations();

    const [mutation] = queryClient.getMutationCache().getAll();
    await flushUntil(() => mutation.state.status === "error");
    expect(attempts).toBe(5);
  });
});

describe("queued writes past the retention window", () => {
  const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000;
  const EIGHT_DAYS_MS = 8 * 24 * 60 * 60 * 1000;

  async function restoreAndAge(
    mutationKey: MutationKey,
    variables: unknown,
    ageMs: number,
  ) {
    const queryClient = await restoreQueuedWrite(mutationKey, variables);
    vi.setSystemTime(Date.now() + ageMs);
    return queryClient;
  }

  it("drops a list write queued more than a week ago and says it was not saved", async () => {
    const requests = vi.fn();
    server.use(
      http.put(`*/api/shopping-lists/${LIST_ID}/items/${ITEM_ID}`, () => {
        requests();
        return HttpResponse.json({});
      }),
    );
    const queryClient = await restoreAndAge(
      OFFLINE_MUTATION_KEYS.shoppingListItemUpdate,
      { listId: LIST_ID, itemId: ITEM_ID, data: { isChecked: true } },
      EIGHT_DAYS_MS,
    );

    dropExpiredWrites(
      queryClient,
      (key) => key,
      (key) => key,
    );
    onlineManager.setOnline(true);
    void queryClient.resumePausedMutations();
    await act(() => vi.advanceTimersByTimeAsync(2000));

    expect(requests).not.toHaveBeenCalled();
    expect(queryClient.getMutationCache().getAll()).toEqual([]);
    expect(toast.error).toHaveBeenCalledWith("offline.writeFailed");
  });

  it("drops an expired card delete with the card delete toast", async () => {
    const queryClient = await restoreAndAge(
      OFFLINE_MUTATION_KEYS.digitalCardDelete,
      CARD_ID,
      EIGHT_DAYS_MS,
    );

    dropExpiredWrites(
      queryClient,
      (key) => key,
      (key) => key,
    );

    expect(queryClient.getMutationCache().getAll()).toEqual([]);
    expect(toast.error).toHaveBeenCalledWith("offline.cardDeleteFailed");
  });

  it("keeps a write queued less than a week ago", async () => {
    vi.mocked(toast.error).mockClear();
    const queryClient = await restoreAndAge(
      OFFLINE_MUTATION_KEYS.digitalCardPin,
      { id: CARD_ID, pinned: true },
      SIX_DAYS_MS,
    );

    dropExpiredWrites(
      queryClient,
      (key) => key,
      (key) => key,
    );

    expect(queryClient.getMutationCache().getAll()).toHaveLength(1);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("never sends an expired write still paused in a tab left open", async () => {
    const requests = vi.fn();
    server.use(
      http.put(`*/api/digital-cards/${CARD_ID}/pin`, () => {
        requests();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    onlineManager.setOnline(false);
    const queryClient = replayClient();
    const queued = queryClient
      .getMutationCache()
      .build(queryClient, {
        mutationKey: OFFLINE_MUTATION_KEYS.digitalCardPin,
      });
    void queued.execute({ id: CARD_ID, pinned: true });
    await flushUntil(() => queued.state.isPaused);
    vi.setSystemTime(Date.now() + EIGHT_DAYS_MS);

    dropExpiredWrites(
      queryClient,
      (key) => key,
      (key) => key,
    );
    onlineManager.setOnline(true);
    void queryClient.resumePausedMutations();
    await act(() => vi.advanceTimersByTimeAsync(2000));

    expect(requests).not.toHaveBeenCalled();
  });
});
