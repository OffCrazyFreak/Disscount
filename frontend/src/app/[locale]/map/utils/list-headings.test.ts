import { describe, expect, it } from "vitest";

import { listHeadings } from "@/app/[locale]/map/utils/list-headings";

const labels = {
  favorite: (n: number) => `fav ${n}`,
  onMap: (n: number) => `map ${n}`,
  elsewhere: (n: number) => `else ${n}`,
  others: (n: number) => `others ${n}`,
};

describe("listHeadings", () => {
  it("keeps the old on-map and elsewhere split when there are no favourites", () => {
    expect(
      listHeadings({ pinned: 1, favorite: 0, onMap: 3, elsewhere: 2, labels }),
    ).toEqual(
      new Map([
        [1, "map 3"],
        [4, "else 2"],
      ]),
    );
  });

  it("adds no headings for one plain group", () => {
    expect(
      listHeadings({ pinned: 0, favorite: 0, onMap: 5, elsewhere: 0, labels }),
    ).toBeUndefined();
  });

  it("puts favourites first and names the rest", () => {
    expect(
      listHeadings({ pinned: 0, favorite: 2, onMap: 5, elsewhere: 0, labels }),
    ).toEqual(
      new Map([
        [0, "fav 2"],
        [2, "others 5"],
      ]),
    );
  });

  it("starts favourites after a shared store and keeps the split below them", () => {
    expect(
      listHeadings({ pinned: 1, favorite: 2, onMap: 3, elsewhere: 4, labels }),
    ).toEqual(
      new Map([
        [1, "fav 2"],
        [3, "map 3"],
        [6, "else 4"],
      ]),
    );
  });
});
