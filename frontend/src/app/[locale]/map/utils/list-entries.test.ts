import { describe, expect, it } from "vitest";

import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";
import { toListEntries } from "@/app/[locale]/map/utils/list-entries";

const rows = ["a", "b", "c"].map((key) => ({ key }) as IListedStore);

describe("toListEntries", () => {
  it("puts each heading before the row its group starts at", () => {
    const entries = toListEntries(
      rows,
      new Map([
        [0, "On the map · 2"],
        [2, "Elsewhere · 1"],
      ]),
    );

    expect(entries.map((entry) => entry.key)).toEqual([
      "heading:0",
      "a",
      "b",
      "heading:2",
      "c",
    ]);
  });

  it("lists only stores without headings", () => {
    expect(toListEntries(rows, undefined).map((entry) => entry.kind)).toEqual([
      "store",
      "store",
      "store",
    ]);
  });
});
