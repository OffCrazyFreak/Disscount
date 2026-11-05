import { describe, expect, it } from "vitest";

import { isProtectedRoute } from "@/constants/protected-routes";

describe("isProtectedRoute", () => {
  it("covers each protected section and its detail pages", () => {
    expect(isProtectedRoute("/watchlist")).toBe(true);
    expect(isProtectedRoute("/shopping-lists/abc")).toBe(true);
    expect(isProtectedRoute("/digital-cards/new")).toBe(true);
  });

  it("matches whole segments only", () => {
    expect(isProtectedRoute("/watchlisting")).toBe(false);
    expect(isProtectedRoute("/dashboards")).toBe(false);
  });

  it("leaves public pages alone", () => {
    expect(isProtectedRoute("/")).toBe(false);
    expect(isProtectedRoute("/products/3850104000123")).toBe(false);
  });
});
