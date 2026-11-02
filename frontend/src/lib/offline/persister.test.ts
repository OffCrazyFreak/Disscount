import { beforeEach, describe, expect, it, vi } from "vitest";

const db = new Map<string, unknown>();
let identity = "alice";
let releasePurge: (() => void) | undefined;

vi.mock("idb-keyval", () => ({
  get: async (key: string) => db.get(key),
  set: async (key: string, value: unknown) => void db.set(key, value),
  del: async (key: string) => void db.delete(key),
}));
vi.mock("@/lib/offline/cache-identity", () => ({
  scopedCacheKey: (base: string, explicit?: string) =>
    `${base}:${explicit ?? identity}`,
}));
vi.mock("@/lib/offline/purge-gate", () => ({
  whenPurgesSettled: () =>
    new Promise<void>((resolve) => (releasePurge = resolve)),
}));

const { persistOptions } = await import("@/lib/offline/persister");

describe("persisted cache writes", () => {
  beforeEach(() => {
    db.clear();
    identity = "alice";
    releasePurge = undefined;
    vi.useFakeTimers();
  });

  async function persistAndHoldOnPurge() {
    void persistOptions.persister.persistClient({
      timestamp: 0,
      buster: "",
      clientState: { queries: [], mutations: [] },
    });
    // The persister throttles, so the write only reaches storage after its interval.
    await vi.runAllTimersAsync();
    expect(releasePurge).toBeDefined();
  }

  it("drops a write whose account signed out while it waited on the purge", async () => {
    await persistAndHoldOnPurge();

    identity = "anon";
    releasePurge?.();
    await vi.runAllTimersAsync();

    expect([...db.keys()]).toEqual([]);
  });

  it("writes under the same account once the purge settles", async () => {
    await persistAndHoldOnPurge();

    releasePurge?.();
    await vi.runAllTimersAsync();

    expect([...db.keys()]).toEqual(["disscount-react-query-cache:alice"]);
  });
});
