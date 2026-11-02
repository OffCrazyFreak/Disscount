import { describe, expect, it } from "vitest";

import { getAppStorage } from "@/utils/browser/storage/core";
import {
  getWatchlistPriceSnapshot,
  setWatchlistPriceSnapshot,
  subscribeToWatchlistPriceSnapshots,
} from "@/utils/browser/storage/watchlist";

const snapshot = { scope: "", prices: { "385": 99 } };

describe("watchlist price snapshot storage", () => {
  it("keeps one snapshot per account and removes only the one asked for", () => {
    setWatchlistPriceSnapshot("a", snapshot);
    setWatchlistPriceSnapshot("b", snapshot);
    setWatchlistPriceSnapshot("a", null);

    expect(getWatchlistPriceSnapshot("a")).toBeNull();
    expect(getAppStorage().watchlistPriceSnapshots).toEqual({ b: snapshot });
  });

  it("re-reads after another tab writes, so its reset is not overwritten", () => {
    setWatchlistPriceSnapshot("tabs", snapshot);
    const unsubscribe = subscribeToWatchlistPriceSnapshots(() => {});

    const otherTab = { scope: "", prices: { "385": 79 } };
    localStorage.setItem(
      "Disscount_app",
      JSON.stringify({ watchlistPriceSnapshots: { tabs: otherTab } }),
    );
    window.dispatchEvent(
      new StorageEvent("storage", { storageArea: localStorage }),
    );

    expect(getWatchlistPriceSnapshot("tabs")).toEqual(otherTab);
    unsubscribe();
  });
});
