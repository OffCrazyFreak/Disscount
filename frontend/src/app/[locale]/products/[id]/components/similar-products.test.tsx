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
      '<span lang="hr" class="font-medium line-clamp-2">Dukat mlijeko 1 l</span>',
    );
  });
});
