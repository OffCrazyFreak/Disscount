import { beforeEach, describe, expect, it, vi } from "vitest";

const db = new Map<string, unknown>();
let identity = "alice";
let releasePurge: (() => void) | undefined;

vi.mock("idb-keyval", () => ({
  createStore: () => "store",
  set: async (key: string, value: unknown) => void db.set(key, value),
  keys: async () => [...db.keys()],
  getMany: async (list: string[]) => list.map((key) => db.get(key)),
  delMany: async (list: string[]) => list.forEach((key) => db.delete(key)),
}));
vi.mock("@/lib/offline/cache-identity", () => ({
  getCacheIdentity: () => identity,
}));
vi.mock("@/lib/offline/purge-gate", () => ({
  whenPurgesSettled: () =>
    new Promise<void>((resolve) => (releasePurge = resolve)),
}));
vi.mock("@/lib/api/digital-cards/queries", () => ({
  postCardsUsed: async () => undefined,
}));

const { recordCardUsed } = await import("@/lib/api/digital-cards/last-used");

describe("recordCardUsed", () => {
  beforeEach(() => {
    db.clear();
    identity = "alice";
    releasePurge = undefined;
    // Only checked for presence: without it the queue is skipped as unsupported.
    vi.stubGlobal("indexedDB", {});
  });

  it("drops a use whose account signed out while it waited on the purge", async () => {
    recordCardUsed("card");

    identity = "anon";
    releasePurge?.();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect([...db.keys()]).toEqual([]);
  });

  it("queues the use under the same account once the purge settles", async () => {
    recordCardUsed("card");

    releasePurge?.();

    await vi.waitFor(() => expect([...db.keys()]).toEqual(["alice:card"]));
  });
});
