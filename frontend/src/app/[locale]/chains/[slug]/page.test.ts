import { beforeEach, describe, expect, it, vi } from "vitest";

import ChainPage, { generateMetadata } from "@/app/[locale]/chains/[slug]/page";
import { getServerChainStats } from "@/lib/cijene-api/server/get-chain-stats";
import { appUrl } from "@/lib/env";
import { getStoreDirectory } from "@/lib/store-locations/get-store-directory";

vi.mock("server-only", () => ({}));

const locale = vi.hoisted(() => ({ current: "hr" }));

vi.mock("next-intl/server", () => ({
  getLocale: async () => locale.current,
  getTranslations: async () => (key: string) => key,
}));

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("@/lib/cijene-api/server/get-chain-stats", () => ({
  getServerChainStats: vi.fn(),
}));

vi.mock("@/lib/store-locations/get-store-directory", () => ({
  getStoreDirectory: vi.fn(),
}));

function props(slug: string) {
  return {
    params: Promise.resolve({ locale: locale.current, slug }),
  } as PageProps<"/[locale]/chains/[slug]">;
}

describe("chain page", () => {
  beforeEach(() => {
    locale.current = "hr";
    vi.mocked(getServerChainStats).mockResolvedValue([
      {
        chain_code: "konzum",
        price_date: "2026-11-20",
        price_count: 5_282_501,
        store_count: 573,
        created_at: "2026-11-20T09:35:11Z",
      },
    ]);
    vi.mocked(getStoreDirectory).mockResolvedValue({
      stores: [],
      generatedAt: "2026-11-23T00:00:00Z",
    });
  });

  it("answers 404 for a chain we do not map, before asking upstream", async () => {
    await expect(ChainPage(props("nope"))).rejects.toThrow("NEXT_NOT_FOUND");

    expect(getServerChainStats).not.toHaveBeenCalled();
    expect(getStoreDirectory).not.toHaveBeenCalled();
  });

  it("canonicalises the Croatian hub to itself and keeps it indexable", async () => {
    const metadata = await generateMetadata(props("konzum"));

    expect(metadata.alternates?.canonical).toBe(`${appUrl()}/chains/konzum`);
    expect(metadata.robots).toBeUndefined();
  });

  it("keeps translated hubs out of the index", async () => {
    locale.current = "en";

    const metadata = await generateMetadata(props("konzum"));

    expect(metadata.alternates?.canonical).toBe(`${appUrl()}/en/chains/konzum`);
    expect(metadata.robots).toMatchObject({ index: false });
  });

  it("still renders the store facts while upstream chain stats are down", async () => {
    vi.mocked(getServerChainStats).mockResolvedValue(null);

    await expect(ChainPage(props("konzum"))).resolves.toBeTruthy();
    expect((await generateMetadata(props("konzum"))).robots).toBe(
      undefined,
    );
  });

  it("keeps a chain with no store and no prices out of the index", async () => {
    vi.mocked(getServerChainStats).mockResolvedValue([]);

    const metadata = await generateMetadata(props("konzum"));

    expect(metadata.robots).toMatchObject({ index: false });
  });
});
