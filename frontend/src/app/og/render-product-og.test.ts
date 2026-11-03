import { http, HttpResponse } from "msw";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
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
  it("renders a 1200x630 JPEG with the year-long cache", async () => {
    servePhoto(ONE_PIXEL_JPEG);

    const response = await renderProductOg(PHOTO);
    const card = await sharp(await response.arrayBuffer()).metadata();

    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(card.format).toBe("jpeg");
    expect(card.isProgressive).toBe(false);
    expect(card.width).toBe(1200);
    expect(card.height).toBe(630);
  });

  it("stays under WhatsApp's 600 KB limit with a photo of pure noise", async () => {
    const side = 1080;
    const noise = await sharp(randomBytes(side * side * 3), {
      raw: { width: side, height: side, channels: 3 },
    })
      .jpeg({ quality: 86 })
      .toBuffer();
    servePhoto(noise);

    const response = await renderProductOg(PHOTO);

    expect((await response.arrayBuffer()).byteLength).toBeLessThan(600_000);
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
