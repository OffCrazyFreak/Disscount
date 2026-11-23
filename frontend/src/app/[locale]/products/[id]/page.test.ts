import type { ResolvingMetadata } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProductDetailsPage, {
  generateMetadata,
} from "@/app/[locale]/products/[id]/page";
import { getServerProduct } from "@/lib/cijene-api/server/get-product";

vi.mock("server-only", () => ({}));

vi.mock("next-intl/server", () => ({
  getLocale: async () => "hr",
  getTranslations: async () => (key: string) => key,
}));

vi.mock("@/lib/cijene-api/server/get-product", () => ({
  getServerProduct: vi.fn(),
}));

const EAN = "5449000000996";

const PROPS = {
  params: Promise.resolve({ locale: "hr", id: EAN }),
} as PageProps<"/[locale]/products/[id]">;

function metadataFor() {
  return generateMetadata(
    PROPS,
    // Only a found product reads the layout metadata.
    Promise.resolve({}) as ResolvingMetadata,
  );
}

describe("product page", () => {
  beforeEach(() => {
    vi.mocked(getServerProduct).mockReset();
  });

  it("throws while upstream is down, so the page answers with a 5xx", async () => {
    vi.mocked(getServerProduct).mockResolvedValue({ status: "unavailable" });

    await expect(ProductDetailsPage(PROPS)).rejects.toThrow(EAN);
  });

  it("leaves robots alone while upstream is down", async () => {
    vi.mocked(getServerProduct).mockResolvedValue({ status: "unavailable" });

    const metadata = await metadataFor();

    expect(metadata.robots).toBeUndefined();
  });

  it("clears the layout's self canonical while upstream is down", async () => {
    vi.mocked(getServerProduct).mockResolvedValue({ status: "unavailable" });

    // Next replaces alternates whole, so this null wins over the layout's canonical "./".
    expect((await metadataFor()).alternates).toEqual({ canonical: null });
  });
});
