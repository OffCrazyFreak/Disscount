import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { BACKEND_ORIGIN } from "@/lib/api/backend-origin";
import { getVerifiedMainPhotoUrl } from "@/lib/api/product-images/server";
import { server } from "@/test/msw-server";

vi.mock("server-only", () => ({}));

const EAN = "3856016906549";

function photo(id: string, status: string) {
  return {
    id,
    status,
    source: "USER",
    fullUrl: `https://images.test/${id}.jpg`,
    thumbUrl: `https://images.test/${id}-thumb.jpg`,
    smallUrl: `https://images.test/${id}-small.webp`,
  };
}

function serveImages(images: ReturnType<typeof photo>[]) {
  server.use(
    http.get(`${BACKEND_ORIGIN}/api/products/${EAN}/images`, () =>
      HttpResponse.json({ ean: EAN, images }),
    ),
  );
}

describe("getVerifiedMainPhotoUrl", () => {
  it("returns a confirmed main photo", async () => {
    serveImages([photo("main", "VERIFIED")]);

    await expect(getVerifiedMainPhotoUrl(EAN)).resolves.toBe(
      "https://images.test/main.jpg",
    );
  });

  it("ignores an unconfirmed main photo, even with a confirmed one behind it", async () => {
    serveImages([photo("main", "PENDING"), photo("other", "VERIFIED")]);

    await expect(getVerifiedMainPhotoUrl(EAN)).resolves.toBeNull();
  });

  it("returns null without photos", async () => {
    serveImages([]);

    await expect(getVerifiedMainPhotoUrl(EAN)).resolves.toBeNull();
  });

  it("returns null when the backend fails", async () => {
    server.use(
      http.get(
        `${BACKEND_ORIGIN}/api/products/${EAN}/images`,
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    await expect(getVerifiedMainPhotoUrl(EAN)).resolves.toBeNull();
  });
});
