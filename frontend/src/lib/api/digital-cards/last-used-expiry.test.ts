import { expect, it, vi } from "vitest";

const db = new Map<string, unknown>();
const postCardsUsed = vi.fn(async (_uses: unknown) => undefined);

vi.mock("idb-keyval", () => ({
  createStore: () => "store",
  set: async (key: string, value: unknown) => void db.set(key, value),
  keys: async () => [...db.keys()],
  getMany: async (list: string[]) => list.map((key) => db.get(key)),
  delMany: async (list: string[]) => list.forEach((key) => db.delete(key)),
}));
vi.mock("@/lib/offline/idb-transactions", () => ({
  deleteIf: async (
    key: string,
    _store: unknown,
    matches: (v: unknown) => boolean,
  ) => {
    if (matches(db.get(key))) db.delete(key);
  },
}));
vi.mock("@/lib/offline/cache-identity", () => ({
  getCacheIdentity: () => "alice",
}));
vi.mock("@/lib/api/digital-cards/queries", () => ({
  postCardsUsed: (uses: unknown) => postCardsUsed(uses),
}));

const { recordCardUsed } = await import("@/lib/api/digital-cards/last-used");

it("drops a use queued more than a week ago instead of sending it", async () => {
  vi.stubGlobal("indexedDB", {});
  db.set("alice:old", {
    id: "old",
    usedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // The first use of a session flushes at once, taking the old one along.
  recordCardUsed("new");

  await vi.waitFor(() => expect(postCardsUsed).toHaveBeenCalled());
  const [sent] = postCardsUsed.mock.calls[0] as [{ id: string }[]];
  expect(sent.map(({ id }) => id)).toEqual(["new"]);
  expect([...db.keys()]).toEqual([]);
});
