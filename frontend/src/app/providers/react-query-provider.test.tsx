import { act, waitFor } from "@testing-library/react";
import {
  QueryClient,
  dehydrate,
  onlineManager,
  useQueryClient,
} from "@tanstack/react-query";
import { http, HttpResponse } from "msw/http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ReactQueryProviderWrapper from "@/app/providers/react-query-provider";
import { setCacheIdentity } from "@/lib/offline/cache/cache-identity";
import { persistOptions } from "@/lib/offline/cache/persister";
import { OFFLINE_MUTATION_KEYS } from "@/lib/offline/writes/offline-mutation-keys";
import { registerOfflineMutationDefaults } from "@/lib/offline/writes/offline-mutations";
import { renderWithProviders } from "@/test/render";
import { server } from "@/test/msw-server";

const disk = vi.hoisted(() => new Map<string, unknown>());
vi.mock("idb-keyval", () => ({
  get: async (key: string) => disk.get(key),
  set: async (key: string, value: unknown) => void disk.set(key, value),
  del: async (key: string) => void disk.delete(key),
}));

const LIST_ID = "5b0e6c1a-7d2f-4e8a-9c3b-1f4d6a8e2c70";
const ITEM_ID = "0f3a9d52-6c1e-4b7a-8e2d-9a4c5b6d7e81";
const SNAPSHOT_KEY = "disscount-react-query-cache:user-a";

async function saveQueuedTick() {
  onlineManager.setOnline(false);

  const before = new QueryClient();
  registerOfflineMutationDefaults(
    before,
    (key) => key,
    (key) => key,
  );

  const tick = before.getMutationCache().build(before, {
    mutationKey: OFFLINE_MUTATION_KEYS.shoppingListItemUpdate,
  });
  void tick.execute({
    listId: LIST_ID,
    itemId: ITEM_ID,
    data: { name: "Mlijeko", amount: 1, isChecked: true },
  });
  await waitFor(() => expect(tick.state.isPaused).toBe(true));

  disk.set(
    SNAPSHOT_KEY,
    JSON.stringify({
      timestamp: Date.now(),
      buster: persistOptions.buster,
      priceShape: "numbers",
      clientState: dehydrate(before, persistOptions.dehydrateOptions),
    }),
  );

  // The page that queued it is gone; the next start only sees the disk.
  onlineManager.setOnline(true);
}

function queuedWritesOnDisk(): number {
  const snapshot = JSON.parse(String(disk.get(SNAPSHOT_KEY)));
  return snapshot.clientState.mutations.length;
}

function startApp() {
  let client: QueryClient | undefined;

  function CaptureClient() {
    client = useQueryClient();
    return null;
  }

  renderWithProviders(
    <ReactQueryProviderWrapper>
      <CaptureClient />
    </ReactQueryProviderWrapper>,
  );

  return () => client!;
}

function setBrowserOnline(online: boolean) {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(online);
}

let sentTicks = 0;

beforeEach(() => {
  disk.clear();
  sentTicks = 0;
  setCacheIdentity("user-a");
  server.use(
    http.put(`*/api/shopping-lists/${LIST_ID}/items/${ITEM_ID}`, () => {
      sentTicks += 1;
      return navigator.onLine ? HttpResponse.json({}) : HttpResponse.error();
    }),
  );
});

afterEach(() => {
  onlineManager.setOnline(true);
});

describe("a start with the browser offline", () => {
  it("keeps a restored write queued and sends it once the browser is online", async () => {
    await saveQueuedTick();
    setBrowserOnline(false);

    const client = startApp();
    await waitFor(() =>
      expect(client().getMutationCache().getAll()).toHaveLength(1),
    );
    // Past the snapshot's save throttle, so a dropped write would be gone from the disk too.
    await act(() => new Promise((resolve) => setTimeout(resolve, 1500)));

    const [tick] = client().getMutationCache().getAll();
    expect(tick.state.isPaused).toBe(true);
    expect(sentTicks).toBe(0);
    expect(queuedWritesOnDisk()).toBe(1);

    setBrowserOnline(true);
    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    await waitFor(() => expect(sentTicks).toBe(1));
    expect(tick.state.isPaused).toBe(false);
  });
});
