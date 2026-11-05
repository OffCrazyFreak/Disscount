import { describe, expect, it } from "vitest";
import { selectsEveryOption } from "@/app/[locale]/products/utils/facets/selects-every-option";
import type { IFacetSelect } from "@/app/[locale]/products/hooks/use-product-facets";

function facet(counts?: Record<string, number>): IFacetSelect {
  return {
    options: ["Osijek", "Split", "Zagreb"],
    selected: [],
    counts,
    disabled: false,
  };
}

describe("selectsEveryOption", () => {
  it("is true when every option is picked", () => {
    expect(selectsEveryOption(facet(), ["Zagreb", "Split", "Osijek"])).toBe(
      true,
    );
  });

  it("is false when one option is left out", () => {
    expect(selectsEveryOption(facet(), ["Zagreb", "Split"])).toBe(false);
  });

  it("ignores options without results, which cannot be picked", () => {
    const counts = { Osijek: 0, Split: 4, Zagreb: 9 };

    expect(selectsEveryOption(facet(counts), ["Zagreb", "Split"])).toBe(true);
  });

  it("keeps a lone available option as a real filter", () => {
    const counts = { Osijek: 0, Split: 0, Zagreb: 9 };

    expect(selectsEveryOption(facet(counts), ["Zagreb"])).toBe(false);
  });
});
