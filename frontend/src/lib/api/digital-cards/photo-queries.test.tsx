import { http, HttpResponse } from "msw/http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import apiClient from "@/lib/api/api-base";
import { fetchCardPhotoBlob } from "@/lib/api/digital-cards/photo-queries";
import { server } from "@/test/msw-server";

describe("fetchCardPhotoBlob", () => {
  // Node's Request, which the fetch adapter builds, cannot resolve a relative URL as a page can.
  beforeEach(() => {
    apiClient.defaults.baseURL = window.location.origin;
  });
  afterEach(() => {
    apiClient.defaults.baseURL = "";
  });

  it("keeps the photo out of the browser HTTP cache, which another account could read", async () => {
    server.use(
      http.get(
        "*/api/digital-cards/:id/photos/:slot",
        () =>
          new HttpResponse("photo", {
            headers: { "content-type": "image/webp" },
          }),
      ),
    );
    // MSW rebuilds the request for its handlers, so the cache mode is read off the real call.
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const blob = await fetchCardPhotoBlob("card-1", "front", "thumb", "abc");

    const [request] = fetchSpy.mock.calls[0] ?? [];
    expect(request instanceof Request ? request.cache : undefined).toBe(
      "no-store",
    );
    expect(await blob.text()).toBe("photo");
  });
});
