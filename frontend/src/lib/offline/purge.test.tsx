import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { purgeOfflineCache } from "@/lib/offline/purge";
import {
  getWatchlistPriceSnapshot,
  setWatchlistPriceSnapshot,
} from "@/utils/browser/storage/watchlist";

// IndexedDB buckets have their own tests; this one covers the localStorage baseline.
vi.mock("@/lib/offline/persister", () => ({
  removePersistedCacheFor: vi.fn(async () => {}),
}));
vi.mock("@/lib/offline/card-photo-store", () => ({
  deleteForIdentity: vi.fn(async () => {}),
}));
vi.mock("@/lib/offline/card-photo-outbox", () => ({
  deleteOutboxForIdentity: vi.fn(async () => {}),
}));
vi.mock("@/lib/api/digital-cards/last-used", () => ({
  deleteUsedQueueForIdentity: vi.fn(async () => {}),
}));

describe("purgeOfflineCache", () => {
  it("deletes the departing account's watched-price baseline", async () => {
    const snapshot = { scope: "", prices: { "385": 99 } };
    setWatchlistPriceSnapshot("leaving", snapshot);
    setWatchlistPriceSnapshot("staying", snapshot);

    await purgeOfflineCache(new QueryClient(), "leaving");

    expect(getWatchlistPriceSnapshot("leaving")).toBeNull();
    expect(getWatchlistPriceSnapshot("staying")).toEqual(snapshot);
  });
});
