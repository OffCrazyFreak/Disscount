import { beforeEach, describe, expect, it, vi } from "vitest";
import { productShareImageFile } from "@/app/og/product-share-image";
import { GET } from "@/app/og/products/[ean]/[file]/route";
import renderProductOg from "@/app/og/render-product-og";
import { getVerifiedMainPhotoUrl } from "@/lib/api/product-images/server";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/api/product-images/server", () => ({
  getVerifiedMainPhotoUrl: vi.fn(),
}));
vi.mock("@/app/og/render-product-og", () => ({ default: vi.fn() }));

const EAN = "3856016906549";
const PHOTO = "https://images.test/products/3856016906549/abc.jpg";
const CURRENT_FILE = productShareImageFile(PHOTO);

function get(ean: string, file: string, query = "") {
  const url = `http://localhost:3000/og/products/${ean}/${file}${query}`;

  return GET(new Request(url), {
    params: Promise.resolve({ ean, file }),
  });
}

function expectUncachedRedirect(response: Response, path: string) {
  expect(response.status).toBe(302);
  expect(response.headers.get("location")).toBe(`http://localhost:3000${path}`);
  expect(response.headers.get("cache-control")).toBe("no-store");
}

describe("product share image route", () => {
  beforeEach(() => {
    vi.mocked(getVerifiedMainPhotoUrl).mockReset().mockResolvedValue(PHOTO);
    vi.mocked(renderProductOg)
      .mockReset()
      .mockResolvedValue(new Response("card") as never);
  });

  it("renders the current photo", async () => {
    const response = await get(EAN, CURRENT_FILE);

    expect(await response.text()).toBe("card");
    expect(renderProductOg).toHaveBeenCalledWith(PHOTO);
  });

  it("rejects a malformed id without asking the backend", async () => {
    const response = await get("not-a-product", CURRENT_FILE);

    expect(response.status).toBe(404);
    expect(getVerifiedMainPhotoUrl).not.toHaveBeenCalled();
  });

  it("falls back to the brand image without a photo", async () => {
    vi.mocked(getVerifiedMainPhotoUrl).mockResolvedValue(null);

    expectUncachedRedirect(
      await get(EAN, CURRENT_FILE),
      "/opengraph-image/brand",
    );
    expect(renderProductOg).not.toHaveBeenCalled();
  });

  it("sends an old or made-up file name to the current one without rendering", async () => {
    expectUncachedRedirect(
      await get(EAN, "0000000000000000.jpg"),
      `/og/products/${EAN}/${CURRENT_FILE}`,
    );
    expect(renderProductOg).not.toHaveBeenCalled();
  });

  it("sends a link to the earlier PNG card to the current JPEG without rendering", async () => {
    expectUncachedRedirect(
      await get(EAN, CURRENT_FILE.replace(".jpg", ".png")),
      `/og/products/${EAN}/${CURRENT_FILE}`,
    );
    expect(renderProductOg).not.toHaveBeenCalled();
  });

  it("sends a cache-busting query string to the clean URL without rendering", async () => {
    expectUncachedRedirect(
      await get(EAN, CURRENT_FILE, "?x=1"),
      `/og/products/${EAN}/${CURRENT_FILE}`,
    );
    expect(renderProductOg).not.toHaveBeenCalled();
  });

  it("falls back to the brand image when rendering fails", async () => {
    vi.mocked(renderProductOg).mockRejectedValue(new Error("bucket down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    expectUncachedRedirect(
      await get(EAN, CURRENT_FILE),
      "/opengraph-image/brand",
    );
  });
});
