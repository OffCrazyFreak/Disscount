import { act, waitFor } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCardPhotoActions } from "@/features/digital-cards/hooks/use-card-photo-actions";
import { useDigitalCardFormSubmit } from "@/features/digital-cards/hooks/use-digital-card-form-submit";
import { takePendingCard } from "@/features/digital-cards/utils/pending-card-stash";
import type { DigitalCardRequest } from "@/lib/api/types";
import { setCacheIdentity } from "@/lib/offline/cache/cache-identity";
import { server } from "@/test/msw-server";
import { renderHookWithProviders } from "@/test/render";

const db = vi.hoisted(() => new Map<string, unknown>());

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
    matches: (value: unknown) => boolean,
  ) => {
    if (matches(db.get(key))) db.delete(key);
  },
}));
// jsdom has no canvas, so the resize step is stubbed.
vi.mock("@/features/digital-cards/utils/card-image", () => ({
  prepareCardImage: async () => ({
    full: new Blob(["full"], { type: "image/webp" }),
    thumb: new Blob(["thumb"], { type: "image/webp" }),
  }),
}));
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() },
}));

const CARD_ID = "8f1c2a4e-1b7d-4c55-9a0e-3f6b2d9c7e10";
const DRAFT_KEY = "digital-card-new";
const FRONT_ENTRY = `user-a:${CARD_ID}:front`;

const CARD = {
  cardName: "Konzum",
  cardType: "loyalty",
  storeName: "Konzum",
  codeType: "ean_13",
  codeValue: "3850000000000",
  cardColor: "#ff0000",
} satisfies DigitalCardRequest;

const SAVED_CARD = {
  ...CARD,
  id: CARD_ID,
  chainCode: null,
  barcodeValue: null,
  note: null,
  validFrom: null,
  expiresOn: null,
  balance: null,
  balanceUnit: null,
  pinnedAt: null,
  lastUsedAt: null,
  archivedAt: null,
  createdAt: "2026-11-23T10:00:00Z",
  updatedAt: "2026-11-23T10:00:00Z",
  photos: [],
};

function useSubmitWithPhotos() {
  const photoActions = useCardPhotoActions(CARD_ID);
  return useDigitalCardFormSubmit({
    cardId: CARD_ID,
    isEdit: false,
    draftKey: DRAFT_KEY,
    onSaved: () => undefined,
    photoActions,
  });
}

const front = new File(["x"], "front.jpg", { type: "image/jpeg" });

function renderSubmit() {
  const { result } = renderHookWithProviders(() => useSubmitWithPhotos());
  return () => result.current.onSubmit(CARD, { front });
}

const order: string[] = [];

beforeEach(() => {
  db.clear();
  order.length = 0;
  setCacheIdentity("user-a");
  server.use(
    http.put(`*/api/digital-cards/${CARD_ID}/photos/front`, () => {
      order.push("photo");
      return HttpResponse.json({ slot: "front", sha256: "abc" });
    }),
  );
});

describe("card photos picked with the card", () => {
  it("are queued on the device while the card save still hangs", async () => {
    server.use(
      http.put(`*/api/digital-cards/${CARD_ID}`, async () => {
        await delay("infinite");
        return HttpResponse.json(SAVED_CARD);
      }),
    );

    void renderSubmit()();

    await waitFor(() => expect(db.has(FRONT_ENTRY)).toBe(true));
    expect(order).toEqual([]);
  });

  it("are discarded and handed back to the form when the card is refused", async () => {
    server.use(
      http.put(`*/api/digital-cards/${CARD_ID}`, () =>
        HttpResponse.json({ status: 400 }, { status: 400 }),
      ),
    );

    const submit = renderSubmit();
    await act(submit);

    expect(db.has(FRONT_ENTRY)).toBe(false);
    expect(takePendingCard(DRAFT_KEY)?.photos).toEqual({ front });
    expect(order).toEqual([]);
  });

  it("follow the card once it is saved", async () => {
    server.use(
      http.put(`*/api/digital-cards/${CARD_ID}`, () => {
        order.push("card");
        return HttpResponse.json(SAVED_CARD);
      }),
    );

    const submit = renderSubmit();
    await act(submit);

    expect(order).toEqual(["card", "photo"]);
    expect(db.has(FRONT_ENTRY)).toBe(false);
  });
});
