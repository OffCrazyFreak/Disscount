import { describe, expect, it } from "vitest";

import { WatchType, watchlistItemDtoSchema } from "@/lib/api/schemas/watchlist";

// The shape WatchlistWireFormatTest pins: Spring sends every key, unset times as null.
const storedItem = {
  id: "0b3c6f1e-6f0a-4f4e-9d55-8f2d1c0a7b21",
  userId: "5a1d7c3e-2b4f-4e8a-a1c9-3f6e2d7b8c90",
  productApiId: "3850123456789",
  watchType: "PERCENTAGE",
  thresholdValue: 10,
  createdAt: "2026-11-03T09:15:00",
  updatedAt: "2026-11-03T09:15:00",
};

describe("watchlistItemDtoSchema", () => {
  it("accepts a stored item", () => {
    const parsed = watchlistItemDtoSchema.parse(storedItem);

    expect(parsed.watchType).toBe(WatchType.percentage);
  });

  it("accepts a null update time, which its nullable column allows", () => {
    const parsed = watchlistItemDtoSchema.parse({
      ...storedItem,
      updatedAt: null,
    });

    expect(parsed.updatedAt).toBeNull();
  });

  it("accepts a zero threshold, which the form forbids but the column allows", () => {
    const parsed = watchlistItemDtoSchema.parse({
      ...storedItem,
      thresholdValue: 0,
    });

    expect(parsed.thresholdValue).toBe(0);
  });
});
