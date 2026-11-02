import { describe, expect, it } from "vitest";

import type {
  ChainProductResponse,
  ProductResponse,
} from "@/lib/cijene-api/schemas";
import {
  countPriceDrops,
  getPriceScope,
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
    const saved = { scope: "", prices: { fell: 129, same: 150, rose: 250 } };

    expect(countPriceDrops(current, saved, "")).toBe(1);
  });

  it("never reads a change of store scope as a drop", () => {
    const saved = { scope: "konzum", prices: { milk: 249 } };

    expect(countPriceDrops({ milk: 199 }, saved, "")).toBe(0);
  });
});

describe("getPriceScope", () => {
  it("ignores the order and repeats of pinned chains", () => {
    expect(getPriceScope(["lidl", "konzum", "lidl"])).toBe(
      getPriceScope(["konzum", "lidl"]),
    );
  });
});

describe("nextPriceSnapshot", () => {
  it("keeps baselines and adds first sightings outside the watchlist page", () => {
    const next = nextPriceSnapshot(
      { kept: 99, added: 200 },
      { scope: "", prices: { kept: 129 } },
      "",
      ["kept", "added"],
      false,
    );

    expect(next).toEqual({ scope: "", prices: { kept: 129, added: 200 } });
  });

  it("forgets unwatched products, so re-watching one starts fresh", () => {
    const next = nextPriceSnapshot(
      {},
      { scope: "", prices: { kept: 129, unwatched: 50 } },
      "",
      ["kept"],
      false,
    );

    expect(next).toEqual({ scope: "", prices: { kept: 129 } });
  });

  it("resets to today's prices on a visit, keeping a price that did not load", () => {
    const next = nextPriceSnapshot(
      { kept: 99 },
      { scope: "", prices: { kept: 129, notLoaded: 300 } },
      "",
      ["kept", "notLoaded"],
      true,
    );

    expect(next).toEqual({ scope: "", prices: { kept: 99, notLoaded: 300 } });
  });

  it("rebases on a change of store scope", () => {
    const next = nextPriceSnapshot(
      { milk: 199 },
      { scope: "konzum", prices: { milk: 249, bread: 120 } },
      "",
      ["milk", "bread"],
      false,
    );

    expect(next).toEqual({ scope: "", prices: { milk: 199 } });
  });
});

describe("isSameSnapshot", () => {
  it("compares scope and prices, not object identity", () => {
    const base = { scope: "", prices: { a: 1, b: 2 } };

    expect(isSameSnapshot(base, { scope: "", prices: { b: 2, a: 1 } })).toBe(
      true,
    );
    expect(isSameSnapshot(base, { scope: "lidl", prices: base.prices })).toBe(
      false,
    );
    expect(isSameSnapshot(base, { scope: "", prices: { a: 1 } })).toBe(false);
    expect(isSameSnapshot(base, null)).toBe(false);
  });
});
