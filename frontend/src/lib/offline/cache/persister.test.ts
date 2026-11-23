import { QueryClient } from "@tanstack/react-query";
import { persistQueryClientRestore } from "@tanstack/react-query-persist-client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { trackPurge } from "@/lib/offline/cache/purge-gate";

const db = new Map<string, unknown>();
let identity = "alice";

vi.mock("idb-keyval", () => ({
  get: async (key: string) => db.get(key),
  set: async (key: string, value: unknown) => void db.set(key, value),
  del: async (key: string) => void db.delete(key),
  keys: async () => [...db.keys()],
  delMany: async (keys: string[]) => keys.forEach((key) => db.delete(key)),
}));
vi.mock("@/lib/offline/cache/cache-identity", () => ({
  ANONYMOUS_IDENTITY: "anon",
  scopedCacheKey: (base: string, explicit?: string) =>
    `${base}:${explicit ?? identity}`,
}));

const { deleteOrphanedSnapshots, persistOptions } =
  await import("@/lib/offline/cache/persister");

const CACHE_KEY = "disscount-react-query-cache";

function startPurge() {
  let release = () => undefined as void;
  trackPurge(new Promise<void>((resolve) => (release = resolve)));
  return release;
}

function persistSnapshot() {
  void persistOptions.persister.persistClient({
    timestamp: 0,
    buster: "",
    clientState: { queries: [], mutations: [] },
  });
}

describe("persisted cache writes", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    await vi.runAllTimersAsync();
    identity = "alice";

    // One save goes through, so the next waits out the throttle the way a save just before a sign out does.
    persistSnapshot();
    await vi.advanceTimersByTimeAsync(0);
    db.clear();
  });

  it("drops a snapshot taken before a purge of the same account", async () => {
    persistSnapshot();
    const release = startPurge();

    release();
    await vi.runAllTimersAsync();

    expect([...db.keys()]).toEqual([]);
  });

  it("drops a snapshot of the old account instead of writing it under the new key", async () => {
    persistSnapshot();
    const release = startPurge();
    identity = "bob";

    release();
    await vi.runAllTimersAsync();

    expect([...db.keys()]).toEqual([]);
  });

  it("writes a snapshot taken after the purge started once it settles", async () => {
    const release = startPurge();
    identity = "bob";
    persistSnapshot();
    await vi.runAllTimersAsync();
    expect([...db.keys()]).toEqual([]);

    release();
    await vi.runAllTimersAsync();

    expect([...db.keys()]).toEqual([`${CACHE_KEY}:bob`]);
  });
});

describe("persisted cache age", () => {
  it("restores a wallet last saved a month ago", async () => {
    vi.useRealTimers();
    identity = "alice";
    const cards = [{ id: "card-1" }];
    db.set(
      `${CACHE_KEY}:alice`,
      JSON.stringify({
        timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000,
        buster: persistOptions.buster,
        clientState: {
          mutations: [],
          queries: [
            {
              queryKey: ["digitalCards", "v2", "me"],
              queryHash: '["digitalCards","v2","me"]',
              state: { data: cards, status: "success", dataUpdatedAt: 1 },
            },
          ],
        },
      }),
    );
    const queryClient = new QueryClient();

    await persistQueryClientRestore({ queryClient, ...persistOptions });

    expect(queryClient.getQueryData(["digitalCards", "v2", "me"])).toEqual(
      cards,
    );
  });
});

describe("persisted prices", () => {
  const product = {
    queryKey: ["cijene", "product", "ean", '{"ean":"1"}'],
    queryHash: '["cijene","product","ean","{\\"ean\\":\\"1\\"}"]',
    state: { data: { ean: "1" }, status: "success", dataUpdatedAt: 1 },
  };
  const storeDirectory = {
    queryKey: ["cijene", "store-directory"],
    queryHash: '["cijene","store-directory"]',
    state: { data: [], status: "success", dataUpdatedAt: 1 },
  };
  const queuedWrite = {
    mutationKey: ["shoppingListItems", "update"],
    state: {
      status: "pending",
      isPaused: true,
      variables: { id: "item-1" },
      data: undefined,
      error: null,
      failureCount: 0,
      failureReason: null,
      submittedAt: 1,
      context: undefined,
    },
  };

  async function restoreSnapshot(marker: Record<string, string>) {
    vi.useRealTimers();
    identity = "alice";
    db.set(
      `${CACHE_KEY}:alice`,
      JSON.stringify({
        timestamp: Date.now(),
        buster: persistOptions.buster,
        ...marker,
        clientState: {
          queries: [product, storeDirectory],
          mutations: [queuedWrite],
        },
      }),
    );
    const queryClient = new QueryClient();

    await persistQueryClientRestore({ queryClient, ...persistOptions });

    return queryClient;
  }

  it("drops prices from a snapshot saved before prices were numbers, keeping queued writes", async () => {
    const queryClient = await restoreSnapshot({});

    expect(queryClient.getQueryData(product.queryKey)).toBeUndefined();
    expect(queryClient.getQueryData(storeDirectory.queryKey)).toEqual([]);
    expect(queryClient.getMutationCache().getAll()).toHaveLength(1);
  });

  it("keeps prices from a snapshot saved with numeric prices", async () => {
    const queryClient = await restoreSnapshot({ priceShape: "numbers" });

    expect(queryClient.getQueryData(product.queryKey)).toEqual({ ean: "1" });
  });
});

describe("snapshots left behind", () => {
  it("keeps only the current account's and the anonymous snapshot", async () => {
    identity = "alice";
    db.clear();
    for (const key of [
      CACHE_KEY,
      `${CACHE_KEY}:alice`,
      `${CACHE_KEY}:anon`,
      `${CACHE_KEY}:bob`,
      "disscount-unrelated",
    ]) {
      db.set(key, "{}");
    }

    await deleteOrphanedSnapshots();

    expect([...db.keys()].sort()).toEqual(
      [`${CACHE_KEY}:alice`, `${CACHE_KEY}:anon`, "disscount-unrelated"].sort(),
    );
  });
});
