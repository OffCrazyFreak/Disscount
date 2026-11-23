import { QueryClient } from "@tanstack/react-query";
import { AxiosError, type AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { trackPurge } from "@/lib/offline/cache/purge-gate";
import { OFFLINE_MUTATION_KEYS } from "@/lib/offline/writes/offline-mutation-keys";

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
vi.mock("@/lib/offline/card-photos/idb-transactions", () => ({
  deleteIf: async (
    key: string,
    _store: unknown,
    matches: (v: unknown) => boolean,
  ) => {
    if (matches(db.get(key))) db.delete(key);
  },
  replaceIf: async (
    key: string,
    _store: unknown,
    matches: (v: unknown) => boolean,
    replacement: unknown,
  ) => {
    if (!matches(db.get(key))) return;
    if (replacement === undefined) db.delete(key);
    else db.set(key, replacement);
  },
  swap: async (key: string, _store: unknown, v: unknown) => {
    const previous = db.get(key);
    db.set(key, v);
    return previous;
  },
}));
vi.mock("@/lib/api/digital-cards/photo-queries", () => ({
  uploadCardPhoto: (...args: unknown[]) => upload(...args),
  deleteCardPhoto: async () => undefined,
}));
vi.mock("@/lib/api/digital-cards/photo-cache", () => ({
  setCardPhotoInCache: (...args: unknown[]) => setCache(...args),
}));
vi.mock("@/lib/offline/cache/cache-identity", () => ({
  getCacheIdentity: () => "user",
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const {
  discardQueuedCardPhoto,
  enqueueCardPhoto,
  enqueueCardPhotoRemoval,
  replayCardPhotoOutbox,
  sendQueuedCardPhoto,
} = await import("@/lib/offline/card-photos/card-photo-outbox");

const client = {} as Parameters<typeof sendQueuedCardPhoto>[0];
function photo(name: string) {
  return new Blob([name], { type: "image/webp" });
}

function rejectWith(status: number) {
  return new AxiosError("x", "ERR", undefined, undefined, {
    status,
    data: {},
  } as AxiosResponse);
}

const EIGHT_DAYS_MS = 8 * 24 * 60 * 60 * 1000;

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

    const first = (await enqueueCardPhoto("card", "front", photo("a")))?.nonce;
    const firstSend = sendQueuedCardPhoto(client, "card", "front");
    await started;

    const removal = (await enqueueCardPhotoRemoval("card", "front"))?.nonce;
    const removalSend = sendQueuedCardPhoto(client, "card", "front");

    const replacement = (await enqueueCardPhoto("card", "front", photo("b")))
      ?.nonce;
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

  it("forgets a send result once no caller is waiting on the slot", async () => {
    upload.mockRejectedValueOnce(rejectWith(413));

    await enqueueCardPhoto("card", "front", photo("a"));
    expect((await sendQueuedCardPhoto(client, "card", "front")).outcome).toBe(
      "dropped",
    );

    expect(await sendQueuedCardPhoto(client, "card", "front")).toEqual({
      outcome: "sent",
    });
  });

  it("puts the sent photo in the cache when no newer choice is waiting", async () => {
    upload.mockResolvedValueOnce({ slot: "front", sha256: "a" });

    const nonce = (await enqueueCardPhoto("card", "front", photo("a")))?.nonce;

    expect(await sendQueuedCardPhoto(client, "card", "front")).toMatchObject({
      outcome: "sent",
      nonce,
    });
    expect(setCache).toHaveBeenCalledWith(client, "card", "front", {
      slot: "front",
      sha256: "a",
    });
  });

  it("drops a photo queued more than a week ago without sending it", async () => {
    const queuedAt = Date.now();
    await enqueueCardPhoto("card", "front", photo("a"));
    vi.spyOn(Date, "now").mockReturnValue(queuedAt + EIGHT_DAYS_MS);

    const result = await sendQueuedCardPhoto(client, "card", "front");

    vi.restoreAllMocks();
    expect(result.outcome).toBe("dropped");
    expect(upload).not.toHaveBeenCalled();
    expect(db.size).toBe(0);
  });

  it("keeps a photo whose card has not reached the server when asked to", async () => {
    upload.mockRejectedValueOnce(rejectWith(404));

    await enqueueCardPhoto("card", "front", photo("a"));
    const result = await sendQueuedCardPhoto(client, "card", "front", true);

    expect(result.outcome).toBe("kept");
    expect(db.size).toBe(1);
  });
});

describe("discardQueuedCardPhoto", () => {
  beforeEach(() => db.clear());

  it("puts back the photo that a refused save had replaced", async () => {
    const earlier = await enqueueCardPhoto("card", "front", photo("a"));
    const later = await enqueueCardPhoto("card", "front", photo("b"));

    await discardQueuedCardPhoto("card", "front", later!);

    expect(db.get("user:card:front")).toMatchObject({
      nonce: earlier?.nonce,
      op: "put",
    });
  });

  it("leaves a newer choice queued meanwhile alone", async () => {
    const refused = await enqueueCardPhoto("card", "front", photo("a"));
    const newer = await enqueueCardPhotoRemoval("card", "front");

    await discardQueuedCardPhoto("card", "front", refused!);

    expect(db.get("user:card:front")).toMatchObject({ nonce: newer?.nonce });
  });
});

describe("enqueueCardPhoto", () => {
  beforeEach(() => db.clear());

  it("drops a photo read before a purge of the same account", async () => {
    const queued = enqueueCardPhoto("card", "front", photo("a"));
    trackPurge(Promise.resolve());

    expect(await queued).toBeUndefined();
    expect(db.size).toBe(0);
  });
});

describe("replayCardPhotoOutbox", () => {
  beforeEach(() => {
    db.clear();
    upload.mockReset();
  });

  it("leaves a photo for a card whose save is still on its way", async () => {
    // The replay skips a browser without IndexedDB, and idb-keyval is mocked here.
    vi.stubGlobal("indexedDB", {});
    const queryClient = new QueryClient();
    const saving = queryClient.getMutationCache().build(queryClient, {
      mutationKey: OFFLINE_MUTATION_KEYS.digitalCardSave,
      mutationFn: () => new Promise(() => undefined),
    });
    void saving.execute({ id: "card", data: {} });
    await vi.waitFor(() => expect(saving.state.status).toBe("pending"));

    await enqueueCardPhoto("card", "front", photo("a"));
    await replayCardPhotoOutbox(queryClient, (key) => key);

    expect(upload).not.toHaveBeenCalled();
    expect(db.has("user:card:front")).toBe(true);
  });
});
