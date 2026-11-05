import { act } from "@testing-library/react";
import { http, HttpResponse } from "msw/http";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCardPhotoActions } from "@/app/[locale]/(user)/digital-cards/hooks/use-card-photo-actions";
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
vi.mock("@/lib/offline/idb-transactions", () => ({
  deleteIf: async (
    key: string,
    _store: unknown,
    matches: (value: unknown) => boolean,
  ) => {
    if (matches(db.get(key))) db.delete(key);
  },
}));
// jsdom has no canvas, so the resize step is stubbed.
vi.mock("@/utils/browser/card-image", () => ({
  prepareCardImage: async () => ({
    full: new Blob(["full"], { type: "image/webp" }),
    thumb: new Blob(["thumb"], { type: "image/webp" }),
  }),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const CARD_ID = "card-1";
const UPLOAD_URL = `*/api/digital-cards/${CARD_ID}/photos/front`;
const RATE_LIMITED = "Šalješ prebrzo. Pričekaj minutu pa pokušaj ponovno.";

async function uploadFront() {
  const { result } = renderHookWithProviders(() =>
    useCardPhotoActions(CARD_ID),
  );
  await act(() => result.current.upload("front", new File(["x"], "p.jpg")));
  return result;
}

describe("useCardPhotoActions upload", () => {
  beforeEach(() => db.clear());

  it("tells the user when the server rate limits the upload", async () => {
    server.use(
      http.put(UPLOAD_URL, () =>
        HttpResponse.json(
          { status: 429, detail: RATE_LIMITED },
          { status: 429, headers: { "Retry-After": "60" } },
        ),
      ),
    );

    const result = await uploadFront();

    expect(toast.error).toHaveBeenCalledWith(RATE_LIMITED);
    expect(result.current.status.front).toBe("queued");
  });

  it("waits quietly when the connection drops", async () => {
    server.use(http.put(UPLOAD_URL, () => HttpResponse.error()));

    const result = await uploadFront();

    expect(toast.error).not.toHaveBeenCalled();
    expect(result.current.status.front).toBe("queued");
  });
});
