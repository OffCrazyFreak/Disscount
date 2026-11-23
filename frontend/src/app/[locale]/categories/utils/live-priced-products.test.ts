import { afterEach, describe, expect, it, vi } from "vitest";

import { livePricedProducts } from "@/app/[locale]/categories/utils/live-priced-products";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import type { ServerProductResult } from "@/lib/cijene-api/server/get-product";

function found(ean: string): ServerProductResult {
  return {
    status: "found",
    product: { ean } as ProductResponse,
    fetchedAt: 0,
  };
}

describe("livePricedProducts", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the products found and skips the ones that failed", async () => {
    const lookUp = vi.fn(async (ean: string) =>
      ean === "2" ? ({ status: "unavailable" } as const) : found(ean),
    );

    const result = await livePricedProducts(["1", "2", "3"], lookUp);

    expect([...(result?.keys() ?? [])]).toEqual(["1", "3"]);
  });

  it("answers null when every lookup failed, so the page can answer 500", async () => {
    const lookUp = vi.fn(async () => ({ status: "unavailable" }) as const);

    expect(await livePricedProducts(["1", "2"], lookUp)).toBeNull();
  });

  it("answers an empty map for an empty page", async () => {
    expect(await livePricedProducts([], vi.fn())).toEqual(new Map());
  });

  it("runs no more lookups at once than the cap", async () => {
    let running = 0;
    let peak = 0;

    const lookUp = vi.fn(async (ean: string) => {
      running++;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 1));
      running--;

      return found(ean);
    });

    const eans = Array.from({ length: 24 }, (_, index) => String(index));
    const result = await livePricedProducts(eans, lookUp, { concurrency: 6 });

    expect(peak).toBe(6);
    expect(result?.size).toBe(24);
  });

  it("stops waiting at the deadline and starts no further lookups", async () => {
    vi.useFakeTimers();

    const lookUp = vi.fn(
      (ean: string) =>
        new Promise<ServerProductResult>((resolve) => {
          setTimeout(() => resolve(found(ean)), ean === "1" ? 10 : 60_000);
        }),
    );

    const pending = livePricedProducts(["1", "2", "3", "4"], lookUp, {
      concurrency: 2,
      deadlineMs: 3_000,
    });
    await vi.advanceTimersByTimeAsync(3_000);
    const result = await pending;

    expect([...(result?.keys() ?? [])]).toEqual(["1"]);
    expect(lookUp).toHaveBeenCalledTimes(3);
  });

  it("answers null when the deadline passes before any product is found", async () => {
    vi.useFakeTimers();

    const lookUp = vi.fn(() => new Promise<ServerProductResult>(() => {}));
    const pending = livePricedProducts(["1"], lookUp, { deadlineMs: 3_000 });
    await vi.advanceTimersByTimeAsync(3_000);

    expect(await pending).toBeNull();
  });
});
