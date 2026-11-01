import { describe, expect, it } from "vitest";

import type {
  ChainProductResponse,
  ProductResponse,
} from "@/lib/cijene-api/schemas";
import {
  countPriceDrops,
  getScopedBestPriceCents,
  isSameSnapshot,
  nextPriceSnapshot,
} from "@/lib/watchlist/watchlist-price-drop-utils";

function chain(name: string, min: string): ChainProductResponse {
  return {
    chain: name,
    code: "1",
    name: "Mlijeko",
    brand: null,
    category: null,
    unit: null,
    quantity: null,
    min_price: min,
    max_price: min,
    avg_price: min,
    price_date: "2026-10-13",
  };
}

function product(chains: ChainProductResponse[]): ProductResponse {
  return {
    ean: "1",
    brand: null,
    name: null,
    quantity: null,
    unit: null,
    chains,
  };
}

describe("getScopedBestPriceCents", () => {
  const milk = product([chain("konzum", "1.29"), chain("lidl", "0.99")]);

  it("takes the cheapest chain overall without pinned stores", () => {
    expect(getScopedBestPriceCents(milk, [])).toBe(99);
  });

  it("takes the cheapest pinned chain when the user pinned stores", () => {
    expect(getScopedBestPriceCents(milk, ["konzum"])).toBe(129);
  });

  it("has no price when no pinned chain sells the product", () => {
    expect(getScopedBestPriceCents(milk, ["spar"])).toBeNull();
  });

  it("rounds to whole cents so float noise never reads as a drop", () => {
    expect(getScopedBestPriceCents(product([chain("lidl", "0.29")]), [])).toBe(
      29,
    );
  });
});

describe("countPriceDrops", () => {
  it("counts only products now cheaper than their saved price", () => {
    const current = { fell: 99, same: 150, rose: 300, unseen: 10 };
    const saved = { fell: 129, same: 150, rose: 250 };

    expect(countPriceDrops(current, saved)).toBe(1);
  });
});

describe("nextPriceSnapshot", () => {
  it("only adds first sightings outside the watchlist page", () => {
    const next = nextPriceSnapshot(
      { kept: 99, added: 200 },
      { kept: 129, unwatched: 50 },
      ["kept", "added"],
      false,
    );

    expect(next).toEqual({ kept: 129, added: 200, unwatched: 50 });
  });

  it("resets to today's prices on a visit and forgets unwatched products", () => {
    const next = nextPriceSnapshot(
      { kept: 99 },
      { kept: 129, notLoaded: 300, unwatched: 50 },
      ["kept", "notLoaded"],
      true,
    );

    expect(next).toEqual({ kept: 99, notLoaded: 300 });
  });
});

describe("isSameSnapshot", () => {
  it("compares prices per product, not object identity", () => {
    expect(isSameSnapshot({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    expect(isSameSnapshot({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(isSameSnapshot({ a: 1 }, { a: 2 })).toBe(false);
  });
});
