import { describe, expect, it } from "vitest";
import renderBrandOg from "@/app/og/render-og";

describe("renderBrandOg", () => {
  it("renders a 1200x630 PNG that clients may reuse for a day", async () => {
    const response = await renderBrandOg({ headline: "Naslov", cta: "Kreni" });
    const png = Buffer.from(await response.arrayBuffer());

    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=86400, stale-while-revalidate=604800",
    );
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });
});
