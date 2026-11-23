import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getAveragePrice,
  getCheapestChainByMinPrice,
  getMaxPrice,
  getMinPrice,
  getNewestPriceDate,
  isPriceDateToday,
  parsePrice,
} from "@/utils/product-price-utils";
import { chain, product } from "@/test/price-fixtures";

describe("isPriceDateToday", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("follows the Zagreb date while UTC is still on the day before", () => {
    // 00:30 in Zagreb on 4 November, UTC+1.
    vi.useFakeTimers({ now: new Date("2026-11-03T23:30:00Z") });

    expect(isPriceDateToday("2026-11-04")).toBe(true);
    expect(isPriceDateToday("2026-11-03")).toBe(false);
  });

  it("follows the Zagreb date in summer time too", () => {
    // 00:30 in Zagreb on 15 July, UTC+2.
    vi.useFakeTimers({ now: new Date("2026-07-14T22:30:00Z") });

    expect(isPriceDateToday("2026-07-15")).toBe(true);
    expect(isPriceDateToday("2026-07-14")).toBe(false);
  });
});

describe("parsePrice", () => {
  it("parses the API's decimal strings and rejects junk", () => {
    expect(parsePrice("1.29")).toBe(1.29);
    expect(parsePrice("")).toBeNull();
    expect(parsePrice("n/a")).toBeNull();
  });

  it("reads a zero or negative price as no price", () => {
    expect(parsePrice("0.00")).toBeNull();
    expect(parsePrice("-1.00")).toBeNull();
  });
});

describe("product price summary", () => {
  it("skips chains whose price does not parse", () => {
    const item = product([
      chain("konzum", "1.20", "1.50", "1.30"),
      chain("lidl", "0.99", "1.10", "1.00"),
      chain("spar", "", "", ""),
    ]);

    expect(getMinPrice(item)).toBe(0.99);
    expect(getMaxPrice(item)).toBe(1.5);
    expect(getAveragePrice(item)).toBeCloseTo(1.15);
  });

  it("skips a chain that publishes a zero price", () => {
    const item = product([
      chain("konzum", "1.20", "1.50", "1.30"),
      chain("roto", "0.00"),
    ]);

    expect(getMinPrice(item)).toBe(1.2);
    expect(getMaxPrice(item)).toBe(1.5);
    expect(getAveragePrice(item)).toBe(1.3);
  });

  it("has no price when no chain has one", () => {
    const item = product([chain("spar", "")]);

    expect(getMinPrice(item)).toBeNull();
    expect(getAveragePrice(item)).toBeNull();
  });
});

describe("getCheapestChainByMinPrice", () => {
  it("keeps the first chain on a tie", () => {
    const cheapest = getCheapestChainByMinPrice([
      chain("konzum", "1.20"),
      chain("lidl", "0.99"),
      chain("kaufland", "0.99"),
    ]);

    expect(cheapest?.chain.chain).toBe("lidl");
    expect(cheapest?.price).toBe(0.99);
  });

  it("passes over a chain whose lowest price is zero", () => {
    const cheapest = getCheapestChainByMinPrice([
      chain("roto", "0.00"),
      chain("konzum", "1.20"),
    ]);

    expect(cheapest?.chain.chain).toBe("konzum");
  });

  it("is null when nothing is priced", () => {
    expect(getCheapestChainByMinPrice([chain("spar", "")])).toBeNull();
  });
});

describe("getNewestPriceDate", () => {
  it("picks the latest day any chain published", () => {
    const older = { ...chain("konzum", "1.00"), price_date: "2026-10-11" };
    const newest = { ...chain("lidl", "1.10"), price_date: "2026-10-14" };

    expect(
      getNewestPriceDate(product([older, newest, chain("spar", "1")])),
    ).toBe("2026-10-14");
  });

  it("has no date for a product no chain sells", () => {
    expect(getNewestPriceDate(product())).toBeNull();
  });
});
