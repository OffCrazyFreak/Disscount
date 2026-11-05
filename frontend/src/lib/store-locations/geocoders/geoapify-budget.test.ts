import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { createGeoapifyBudget } =
  await import("@/lib/store-locations/geocoders/geoapify-budget");

const signal = new AbortController().signal;
const PIN = {
  lat: 45.8,
  lon: 15.97,
  source: "geoapify",
  precision: "building",
} as const;

describe("createGeoapifyBudget", () => {
  it("asks once for an address both steps need", async () => {
    const geocode = vi.fn(async () => PIN);
    const budget = createGeoapifyBudget(5, geocode);

    expect(await budget("Ilica 1", "Zagreb", signal)).toEqual(PIN);
    expect(await budget("Ilica 1", "Zagreb", signal)).toEqual(PIN);
    expect(geocode).toHaveBeenCalledTimes(1);
  });

  it("refuses new addresses past the run's limit", async () => {
    const budget = createGeoapifyBudget(1, async () => null);

    await budget("Ilica 1", "Zagreb", signal);

    expect(() => budget("Ilica 2", "Zagreb", signal)).toThrow();
  });

  it("asks again after a failed request", async () => {
    const geocode = vi
      .fn()
      .mockRejectedValueOnce(new Error("429"))
      .mockResolvedValueOnce(PIN);
    const budget = createGeoapifyBudget(5, geocode);

    await expect(budget("Ilica 1", "Zagreb", signal)).rejects.toThrow();
    expect(await budget("Ilica 1", "Zagreb", signal)).toEqual(PIN);
  });
});
