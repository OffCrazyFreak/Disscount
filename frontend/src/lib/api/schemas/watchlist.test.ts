import { describe, expect, it } from "vitest";

import { WatchType, watchlistItemDtoSchema } from "@/lib/api/schemas/watchlist";

// The shape WatchlistWireFormatTest pins: Spring sends every key, unset times as null.
const neverNotifiedItem = {
  id: "0b3c6f1e-6f0a-4f4e-9d55-8f2d1c0a7b21",
  userId: "5a1d7c3e-2b4f-4e8a-a1c9-3f6e2d7b8c90",
  productApiId: "3850123456789",
  watchType: "PERCENTAGE",
  thresholdValue: 10,
  lastNotifiedAt: null,
  createdAt: "2026-11-03T09:15:00",
  updatedAt: "2026-11-03T09:15:00",
};

describe("watchlistItemDtoSchema", () => {
  it("accepts an item that was never notified", () => {
    const parsed = watchlistItemDtoSchema.parse(neverNotifiedItem);

    expect(parsed.lastNotifiedAt).toBeNull();
    expect(parsed.watchType).toBe(WatchType.percentage);
  });

  it("accepts a null update time, which its nullable column allows", () => {
    const parsed = watchlistItemDtoSchema.parse({
      ...neverNotifiedItem,
      updatedAt: null,
    });

    expect(parsed.updatedAt).toBeNull();
  });

  it("rejects a response that drops a key the backend always sends", () => {
    const { lastNotifiedAt: _omitted, ...withoutKey } = neverNotifiedItem;

    expect(watchlistItemDtoSchema.safeParse(withoutKey).success).toBe(false);
  });
});
