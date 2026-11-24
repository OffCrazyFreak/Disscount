import { describe, expect, it } from "vitest";

import {
  isHubIndexable,
  isPageInRange,
  pageGuard,
  PAGE_WINDOW,
  paginationPages,
  parsePageParam,
} from "@/app/[locale]/categories/utils/category-page";

describe("parsePageParam", () => {
  it("reads a missing param as page 1", () => {
    expect(parsePageParam(undefined)).toBe(1);
  });

  it.each(["1", "2", "18"])("reads %s as a page", (value) => {
    expect(parsePageParam(value)).toBe(Number(value));
  });

  it.each(["0", "-1", "01", "1.5", "abc", "", "9999999"])(
    "rejects %j",
    (value) => {
      expect(parsePageParam(value)).toBeNull();
    },
  );

  it("rejects a repeated param", () => {
    expect(parsePageParam(["1", "2"])).toBeNull();
  });
});

describe("isPageInRange", () => {
  it("keeps the first page of an empty category", () => {
    expect(isPageInRange(1, 0)).toBe(true);
  });

  it("allows the last page and rejects the one after it", () => {
    expect(isPageInRange(18, 18)).toBe(true);
    expect(isPageInRange(19, 18)).toBe(false);
  });
});

describe("isHubIndexable", () => {
  it("indexes an indexable category in Croatian only", () => {
    expect(isHubIndexable("hr", { indexable: true, productCount: 3 })).toBe(
      true,
    );
    expect(isHubIndexable("en", { indexable: true, productCount: 3 })).toBe(
      false,
    );
  });

  it("keeps a category the taxonomy does not mark indexable out", () => {
    expect(isHubIndexable("hr", { indexable: false, productCount: 3 })).toBe(
      false,
    );
  });

  it("keeps an empty indexable category out", () => {
    expect(isHubIndexable("hr", { indexable: true, productCount: 0 })).toBe(
      false,
    );
  });

  it("indexes the Croatian index page", () => {
    expect(isHubIndexable("hr")).toBe(true);
    expect(isHubIndexable("de")).toBe(false);
  });
});

describe("paginationPages", () => {
  it("lists every page of a short hub", () => {
    expect(paginationPages(2, 4)).toEqual([1, 2, 3, 4]);
  });

  it("keeps the first and last page and two on each side", () => {
    expect(paginationPages(10, 18)).toEqual([
      1,
      "gap",
      8,
      9,
      10,
      11,
      12,
      "gap",
      18,
    ]);
  });

  it("joins the window to an edge with no gap between them", () => {
    expect(paginationPages(1, 18)).toEqual([1, 2, 3, "gap", 18]);
    expect(paginationPages(4, 18)).toEqual([1, 2, 3, 4, 5, 6, "gap", 18]);
  });

  it("keeps one page on each side in the compact row for phones", () => {
    expect(paginationPages(10, 18, PAGE_WINDOW.compact)).toEqual([
      1,
      "gap",
      9,
      10,
      11,
      "gap",
      18,
    ]);
    expect(paginationPages(2, 11, PAGE_WINDOW.compact)).toEqual([
      1,
      2,
      3,
      "gap",
      11,
    ]);
  });
});

describe("pageGuard", () => {
  it("allows two pages past a short count and a tenth past a long one", () => {
    expect(pageGuard(0)).toBe(2);
    expect(pageGuard(9)).toBe(11);
    expect(pageGuard(78)).toBe(86);
  });
});
