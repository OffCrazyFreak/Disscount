import { QueryClient } from "@tanstack/react-query";
import { persistQueryClientRestore } from "@tanstack/react-query-persist-client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { trackPurge } from "@/lib/offline/purge-gate";

const db = new Map<string, unknown>();
let identity = "alice";

vi.mock("idb-keyval", () => ({
  get: async (key: string) => db.get(key),
  set: async (key: string, value: unknown) => void db.set(key, value),
  del: async (key: string) => void db.delete(key),
}));
vi.mock("@/lib/offline/cache-identity", () => ({
  scopedCacheKey: (base: string, explicit?: string) =>
    `${base}:${explicit ?? identity}`,
}));

const { persistOptions } = await import("@/lib/offline/persister");

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

    // One save goes through, so the next one waits out the throttle interval the way a
    // save just before a sign out does.
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
