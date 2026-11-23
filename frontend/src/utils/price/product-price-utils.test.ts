import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getAveragePrice,
  getCheapestChainByMinPrice,
  getMaxPrice,
  getMinPrice,
  getNewestPriceDate,
  isPriceDateToday,
} from "@/utils/price/product-price-utils";
import { productResponseSchema } from "@/lib/cijene-api/schemas";
import { chain, product, wireProduct } from "@/test/fixtures/price-fixtures";

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

describe("product price summary", () => {
  it("summarizes every chain", () => {
    const item = product([
      chain("konzum", 1.2, 1.5, 1.3),
      chain("lidl", 0.99, 1.1, 1),
    ]);

    expect(getMinPrice(item)).toBe(0.99);
    expect(getMaxPrice(item)).toBe(1.5);
    expect(getAveragePrice(item)).toBeCloseTo(1.15);
  });

  it("skips a chain that publishes a zero price", () => {
    const item = productResponseSchema.parse(
      wireProduct(product([chain("konzum", 1.2, 1.5, 1.3), chain("roto", 0)])),
    );

    expect(getMinPrice(item)).toBe(1.2);
    expect(getMaxPrice(item)).toBe(1.5);
    expect(getAveragePrice(item)).toBe(1.3);
  });

  it("has no price without chains", () => {
    const item = product([]);

    expect(getMinPrice(item)).toBeNull();
    expect(getAveragePrice(item)).toBeNull();
  });
});

describe("getCheapestChainByMinPrice", () => {
  it("keeps the first chain on a tie", () => {
    const cheapest = getCheapestChainByMinPrice([
      chain("konzum", 1.2),
      chain("lidl", 0.99),
      chain("kaufland", 0.99),
    ]);

    expect(cheapest?.chain.chain).toBe("lidl");
    expect(cheapest?.price).toBe(0.99);
  });

  it("is null without chains", () => {
    expect(getCheapestChainByMinPrice([])).toBeNull();
  });
});

describe("getNewestPriceDate", () => {
  it("picks the latest day any chain published", () => {
    const older = { ...chain("konzum", 1), price_date: "2026-10-11" };
    const newest = { ...chain("lidl", 1.1), price_date: "2026-10-14" };

    expect(getNewestPriceDate(product([older, newest, chain("spar", 1)]))).toBe(
      "2026-10-14",
    );
  });

  it("has no date for a product no chain sells", () => {
    expect(getNewestPriceDate(product())).toBeNull();
  });
});
