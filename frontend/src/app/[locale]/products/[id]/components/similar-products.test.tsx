import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import SimilarProducts from "@/app/[locale]/products/[id]/components/similar-products";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: { href: string }) => <a href={href} {...props} />,
}));

describe("SimilarProducts", () => {
  it("links each product by its name in plain HTML", () => {
    const html = renderToStaticMarkup(
      <SimilarProducts
        heading="Slični proizvodi"
        products={[
          { ean: "385001", name: "Dukat mlijeko 1 l", brand: "Dukat" },
          { ean: "385002", name: "Z bregov mlijeko 1 l", brand: null },
        ]}
      />,
    );

    expect(html).toContain("Slični proizvodi");
    expect(html).toMatch(
      /<a href="\/products\/385001"[^>]*>.*Dukat mlijeko 1 l/,
    );
    expect(html).toMatch(/<a href="\/products\/385002"/);
    expect(html).toContain(
      '<span lang="hr" class="font-medium">Dukat mlijeko 1 l</span>',
    );
  });

  it("shows archive names in capitals in sentence case and in full", () => {
    const html = renderToStaticMarkup(
      <SimilarProducts
        heading="Slični proizvodi"
        products={[
          { ean: "1", name: "MLIJEKO ČOKOLADNO 0,5L DUKAT", brand: "DUKAT" },
          { ean: "2", name: "MLIJEKO ČOKOLADNO 0,5L Z'BREGOV", brand: null },
        ]}
      />,
    );

    expect(html).toContain(">Mlijeko čokoladno 0,5L dukat</span>");
    expect(html).toContain(">Mlijeko čokoladno 0,5L z&#x27;bregov</span>");
    expect(html).toContain(">Dukat</span>");
    expect(html).not.toContain("line-clamp");
  });
});
