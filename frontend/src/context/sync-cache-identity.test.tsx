import { QueryClient } from "@tanstack/react-query";
import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { syncCacheIdentity } from "@/context/sync-cache-identity";
import { setCacheIdentity } from "@/lib/offline/cache-identity";
import { peekFormDraft, setFormDraft } from "@/utils/browser/storage/drafts";

// IndexedDB buckets have their own tests; this one covers the localStorage drafts.
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

async function switchTo(
  queryClient: QueryClient,
  ref: { current: string | null },
  identity: string,
) {
  syncCacheIdentity(queryClient, ref, identity, null);
  // The purge it fires settles on its own; let it run before asserting.
  await waitFor(() => expect(ref.current).toBe(identity));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("syncCacheIdentity", () => {
  it("hands a draft typed signed out to the first account that signs in, and no further", async () => {
    const queryClient = new QueryClient();
    const ref = { current: null as string | null };
    setFormDraft("contact", { message: "Bok" });

    await switchTo(queryClient, ref, "account-a");
    expect(peekFormDraft("contact")?.values).toEqual({ message: "Bok" });

    await switchTo(queryClient, ref, "account-b");
    expect(peekFormDraft("contact")).toBeNull();
    expect(localStorage.getItem("Disscount_app")).not.toContain("Bok");
  });

  it("keeps a guest draft away from an account replacing another", async () => {
    const queryClient = new QueryClient();
    setCacheIdentity("account-a");
    const ref = { current: "account-a" as string | null };
    localStorage.setItem(
      "Disscount_app",
      JSON.stringify({
        formDrafts: {
          contact: {
            savedAt: Date.now(),
            owner: "anon",
            values: { message: "Bok" },
          },
        },
      }),
    );

    await switchTo(queryClient, ref, "account-b");

    expect(peekFormDraft("contact")).toBeNull();
  });
});
