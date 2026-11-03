import { beforeEach, describe, expect, it, vi } from "vitest";

import { trackPurge } from "@/lib/offline/purge-gate";

const db = new Map<string, unknown>();
let identity = "alice";

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
// Offline, so a flush keeps the use queued and the tests can read it back.
vi.mock("@/lib/api/digital-cards/queries", () => ({
  postCardsUsed: async () => {
    throw new Error("offline");
  },
}));

const { recordCardUsed } = await import("@/lib/api/digital-cards/last-used");

function startPurge() {
  let release = () => undefined as void;
  trackPurge(new Promise<void>((resolve) => (release = resolve)));
  return release;
}

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("recordCardUsed", () => {
  beforeEach(() => {
    db.clear();
    identity = "alice";
    // Only checked for presence: without it the queue is skipped as unsupported.
    vi.stubGlobal("indexedDB", {});
  });

  // Each use waits on an earlier purge, the window a fast re-login leaves open.
  it("drops a use recorded before a purge of the same account", async () => {
    const releaseEarlier = startPurge();
    recordCardUsed("card");
    const releaseLater = startPurge();

    releaseEarlier();
    releaseLater();
    await settle();

    expect([...db.keys()]).toEqual([]);
  });

  it("drops a use whose account signed out while it waited on the purge", async () => {
    const releaseEarlier = startPurge();
    recordCardUsed("card");
    const releaseLater = startPurge();
    identity = "anon";

    releaseEarlier();
    releaseLater();
    await settle();

    expect([...db.keys()]).toEqual([]);
  });

  it("queues a use recorded after the purge started once it settles", async () => {
    const release = startPurge();
    recordCardUsed("card");

    release();

    await vi.waitFor(() => expect([...db.keys()]).toEqual(["alice:card"]));
  });
});
