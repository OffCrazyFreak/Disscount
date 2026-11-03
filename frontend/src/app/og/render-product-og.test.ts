import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import renderProductOg from "@/app/og/render-product-og";
import { server } from "@/test/msw-server";

const PHOTO = "https://images.test/products/1/a.jpg";

// The smallest valid baseline JPEG: one grey pixel.
const ONE_PIXEL_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==",
  "base64",
);

function servePhoto(body: Uint8Array | string, status = 200) {
  server.use(http.get(PHOTO, () => new HttpResponse(body, { status })));
}

describe("renderProductOg", () => {
  it("renders a 1200x630 PNG with the year-long cache", async () => {
    servePhoto(ONE_PIXEL_JPEG);

    const response = await renderProductOg(PHOTO);
    const png = Buffer.from(await response.arrayBuffer());

    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });

  it("throws when the photo cannot be fetched", async () => {
    servePhoto("gone", 404);

    await expect(renderProductOg(PHOTO)).rejects.toThrow("404");
  });

  it("throws instead of answering 200 when the render fails", async () => {
    servePhoto("not an image");

    await expect(renderProductOg(PHOTO)).rejects.toThrow();
  });
});
