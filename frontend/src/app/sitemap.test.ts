import { beforeEach, describe, expect, it, vi } from "vitest";

import sitemap from "@/app/sitemap";
import { getServerChainStats } from "@/lib/cijene-api/server/get-chain-stats";
import { appUrl } from "@/lib/env";
import { getStoreDirectory } from "@/lib/store-locations/get-store-directory";

vi.mock("server-only", () => ({}));

vi.mock("next/server", () => ({ connection: async () => {} }));

vi.mock("@/lib/cijene-api/server/get-chain-stats", () => ({
  getServerChainStats: vi.fn(),
}));

vi.mock("@/lib/store-locations/get-store-directory", () => ({
  getStoreDirectory: vi.fn(),
}));

const konzumStore = {
  chain: "konzum",
  city: "Zagreb",
} as never;

describe("sitemap", () => {
  beforeEach(() => {
    vi.mocked(getServerChainStats).mockResolvedValue([]);
    vi.mocked(getStoreDirectory).mockResolvedValue({
      stores: [konzumStore],
      generatedAt: "2026-11-23T00:00:00Z",
    });
  });

  it("sends neither priority nor change frequency", async () => {
    for (const entry of await sitemap()) {
      expect(entry).not.toHaveProperty("priority");
      expect(entry).not.toHaveProperty("changeFrequency");
    }
  });

  it("dates only the update posts", async () => {
    const dated = (await sitemap()).filter((entry) => entry.lastModified);

    expect(dated.length).toBeGreaterThan(0);
    for (const entry of dated) expect(entry.url).toContain("/updates/");
  });

  it("leaves statistics out", async () => {
    expect((await sitemap()).map((entry) => entry.url)).not.toContain(
      `${appUrl()}/statistics`,
    );
  });

  it("lets each language version list itself", async () => {
    const products = (await sitemap()).find(
      (entry) => entry.url === `${appUrl()}/products`,
    );

    expect(products?.alternates?.languages).toMatchObject({
      hr: `${appUrl()}/products`,
      en: `${appUrl()}/en/products`,
      "x-default": `${appUrl()}/products`,
    });
  });

  it("lists the chain hubs in Croatian only", async () => {
    const entries = await sitemap();
    const konzum = entries.find(
      (entry) => entry.url === `${appUrl()}/chains/konzum`,
    );

    expect(entries.map((entry) => entry.url)).toContain(`${appUrl()}/chains`);
    expect(konzum).toBeDefined();
    expect(konzum).not.toHaveProperty("alternates");
  });

  it("leaves out a chain with no store on the map and no prices", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toContain(`${appUrl()}/chains/konzum`);
    expect(urls).not.toContain(`${appUrl()}/chains/lidl`);
  });

  it("lists every mapped chain while the store directory is down", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(getStoreDirectory).mockRejectedValue(new Error("down"));

    expect((await sitemap()).map((entry) => entry.url)).toContain(
      `${appUrl()}/chains/lidl`,
    );
  });
});
