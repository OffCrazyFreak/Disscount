import { act, screen } from "@testing-library/react";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { purgeOfflineCache } from "@/lib/offline/purge";
import { setCacheIdentity } from "@/lib/offline/cache-identity";
import { removePersistedCacheFor } from "@/lib/offline/persister";
import { renderWithProviders } from "@/test/render";
import { peekFormDraft, setFormDraft } from "@/utils/browser/storage/drafts";
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

  it("deletes the departing account's form drafts and keeps the next one's", async () => {
    setCacheIdentity("leaving");
    setFormDraft("settings", { username: "Review Shots" });
    setCacheIdentity("staying");
    setFormDraft("contact", { message: "Bok" });

    await purgeOfflineCache(new QueryClient(), "leaving");

    expect(localStorage.getItem("Disscount_app")).not.toContain("Review Shots");
    expect(peekFormDraft("contact")?.values).toEqual({ message: "Bok" });
  });

  it("never renders the departing account's data, and refetches what is on screen", async () => {
    const queryClient = new QueryClient();
    let account = "user-a";
    const rendered: string[] = [];
    function Profile() {
      const { data } = useQuery({
        queryKey: ["users", "me"],
        queryFn: async () => account,
      });
      rendered.push(data ?? "none");
      return <p>{data ?? "none"}</p>;
    }
    renderWithProviders(<Profile />, { queryClient });
    await screen.findByText("user-a");
    queryClient.setQueryData(["shopping-lists", "me"], ["list of user-a"]);

    account = "user-b";
    rendered.length = 0;
    await act(() => purgeOfflineCache(queryClient, "user-a"));

    expect(await screen.findByText("user-b")).toBeInTheDocument();
    expect(rendered).not.toContain("user-a");
    expect(queryClient.getQueryData(["shopping-lists", "me"])).toBeUndefined();
    expect(removePersistedCacheFor).toHaveBeenCalledWith("user-a");
  });

  it("keeps public price data", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(["cijene", "chains"], ["konzum"]);

    await purgeOfflineCache(queryClient, "user-a");

    expect(queryClient.getQueryData(["cijene", "chains"])).toEqual(["konzum"]);
  });
});
