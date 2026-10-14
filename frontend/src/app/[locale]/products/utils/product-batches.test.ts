import { describe, expect, it } from "vitest";

import {
  getNextBatchState,
  getVisibleBatchCount,
  splitIntoBatches,
} from "@/app/[locale]/products/utils/product-batches";

describe("splitIntoBatches", () => {
  it("cuts the items into batches of the given size, last one shorter", () => {
    expect(splitIntoBatches([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(splitIntoBatches([], 2)).toEqual([]);
  });
});

describe("getVisibleBatchCount", () => {
  it("starts over at one batch when the search key changed", () => {
    expect(getVisibleBatchCount({ key: "old", count: 4 }, "new", 5)).toBe(1);
    expect(getVisibleBatchCount({ key: "old", count: 4 }, "new", 0)).toBe(0);
  });

  it("keeps the revealed count within one and the batches available", () => {
    expect(getVisibleBatchCount({ key: "k", count: 3 }, "k", 5)).toBe(3);
    expect(getVisibleBatchCount({ key: "k", count: 9 }, "k", 5)).toBe(5);
    expect(getVisibleBatchCount({ key: "k", count: 0 }, "k", 5)).toBe(1);
    expect(getVisibleBatchCount({ key: "k", count: 3 }, "k", 0)).toBe(0);
  });
});

describe("getNextBatchState", () => {
  it("reveals one more batch, capped at the batches available", () => {
    expect(getNextBatchState({ key: "k", count: 2 }, "k", 5)).toEqual({
      key: "k",
      count: 3,
    });
    expect(getNextBatchState({ key: "k", count: 5 }, "k", 5)).toEqual({
      key: "k",
      count: 5,
    });
  });

  it("counts from the first batch when the search key changed", () => {
    expect(getNextBatchState({ key: "old", count: 4 }, "new", 5)).toEqual({
      key: "new",
      count: 2,
    });
  });
});
