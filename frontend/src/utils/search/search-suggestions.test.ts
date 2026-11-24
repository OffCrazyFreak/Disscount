import { describe, expect, it } from "vitest";

import {
  MAX_SEARCH_SUGGESTIONS,
  rankSearchSuggestions,
} from "@/utils/search/search-suggestions";

describe("rankSearchSuggestions", () => {
  it("finds a product name whatever the case or diacritics", () => {
    expect(rankSearchSuggestions("cokolada", [], ["Čokolada Milka"])).toEqual([
      { text: "Čokolada Milka", kind: "product" },
    ]);
  });

  it("ranks a prefix match over one further along", () => {
    const names = ["Bijelo mlijeko", "Mlijeko 2,8%"];

    expect(
      rankSearchSuggestions("mlijeko", [], names).map(({ text }) => text),
    ).toEqual(["Mlijeko 2,8%", "Bijelo mlijeko"]);
  });

  it("keeps the recent search when a product name reads the same", () => {
    expect(rankSearchSuggestions("mli", ["mlijeko"], ["MLIJEKO"])).toEqual([
      { text: "mlijeko", kind: "recent" },
    ]);
  });

  it("puts a recent search first on a tie", () => {
    const [first] = rankSearchSuggestions("mli", ["mlinci"], ["mlijeko"]);

    expect(first).toEqual({ text: "mlinci", kind: "recent" });
  });

  it("leaves out the text already in the field", () => {
    expect(rankSearchSuggestions("Mlijeko", [], ["MLIJEKO"])).toEqual([]);
  });

  it("caps the list", () => {
    const names = Array.from({ length: 20 }, (_, i) => `mlijeko ${i}`);

    expect(rankSearchSuggestions("mli", [], names)).toHaveLength(
      MAX_SEARCH_SUGGESTIONS,
    );
  });

  it("offers nothing for a blank query", () => {
    expect(rankSearchSuggestions("  ", ["mlijeko"], ["mlijeko"])).toEqual([]);
  });
});
