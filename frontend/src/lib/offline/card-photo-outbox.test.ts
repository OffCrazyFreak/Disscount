import { AxiosError, type AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = new Map<string, unknown>();
const upload = vi.fn();
const setCache = vi.fn();

vi.mock("idb-keyval", () => ({
  createStore: () => "store",
  get: async (key: string) => db.get(key),
  set: async (key: string, value: unknown) => void db.set(key, value),
  del: async (key: string) => void db.delete(key),
  delMany: async (list: string[]) => list.forEach((key) => db.delete(key)),
  keys: async () => [...db.keys()],
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
vi.mock("@/lib/api/digital-cards/photo-queries", () => ({
  uploadCardPhoto: (...args: unknown[]) => upload(...args),
  deleteCardPhoto: async () => undefined,
}));
vi.mock("@/lib/api/digital-cards/photo-cache", () => ({
  setCardPhotoInCache: (...args: unknown[]) => setCache(...args),
}));
vi.mock("@/lib/offline/cache-identity", () => ({
  getCacheIdentity: () => "user",
}));
vi.mock("@/lib/offline/purge-gate", () => ({
  whenPurgesSettled: async () => undefined,
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const { enqueueCardPhoto, enqueueCardPhotoRemoval, sendQueuedCardPhoto } =
  await import("@/lib/offline/card-photo-outbox");

const client = {} as Parameters<typeof sendQueuedCardPhoto>[0];
const photo = (name: string) => new Blob([name], { type: "image/webp" });

function rejectWith(status: number) {
  return new AxiosError("x", "ERR", undefined, undefined, {
    status,
    data: {},
  } as AxiosResponse);
}

describe("sendQueuedCardPhoto", () => {
  beforeEach(() => {
    db.clear();
    upload.mockReset();
    setCache.mockReset();
  });

  it("reports a newer choice's rejection to its own waiting caller", async () => {
    let finishFirst: (value: unknown) => void = () => undefined;
    let markStarted: () => void = () => undefined;
    const started = new Promise<void>((ok) => (markStarted = ok));
    upload
      .mockImplementationOnce(() => {
        markStarted();
        return new Promise((ok) => (finishFirst = ok));
      })
      .mockRejectedValueOnce(rejectWith(413));

    const first = await enqueueCardPhoto("card", "front", photo("a"));
    const firstSend = sendQueuedCardPhoto(client, "card", "front");
    await started;

    const removal = await enqueueCardPhotoRemoval("card", "front");
    const removalSend = sendQueuedCardPhoto(client, "card", "front");

    const replacement = await enqueueCardPhoto("card", "front", photo("b"));
    const replacementSend = sendQueuedCardPhoto(client, "card", "front");

    finishFirst({ slot: "front", sha256: "a" });

    expect(await firstSend).toMatchObject({ outcome: "sent", nonce: first });
    expect(await removalSend).toMatchObject({ nonce: replacement });
    expect((await removalSend).nonce).not.toBe(removal);
    expect(await replacementSend).toMatchObject({
      outcome: "dropped",
      nonce: replacement,
    });
    expect(setCache).not.toHaveBeenCalled();
    expect(db.size).toBe(0);
  });

  it("puts the sent photo in the cache when no newer choice is waiting", async () => {
    upload.mockResolvedValueOnce({ slot: "front", sha256: "a" });

    const nonce = await enqueueCardPhoto("card", "front", photo("a"));

    expect(await sendQueuedCardPhoto(client, "card", "front")).toMatchObject({
      outcome: "sent",
      nonce,
    });
    expect(setCache).toHaveBeenCalledWith(client, "card", "front", {
      slot: "front",
      sha256: "a",
    });
  });

  it("keeps a photo whose card has not reached the server when asked to", async () => {
    upload.mockRejectedValueOnce(rejectWith(404));

    await enqueueCardPhoto("card", "front", photo("a"));
    const result = await sendQueuedCardPhoto(client, "card", "front", true);

    expect(result.outcome).toBe("kept");
    expect(db.size).toBe(1);
  });
});
