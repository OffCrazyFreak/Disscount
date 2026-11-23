import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({
  params: new URLSearchParams("q=mlijeko&chain=lidl"),
  router: { replace: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => navigation.params,
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/products",
  useRouter: () => navigation.router,
}));

const { default: useFilterParams } =
  await import("@/app/[locale]/products/hooks/use-filter-params");

describe("useFilterParams", () => {
  it("keeps the same setters across renders", () => {
    const { result, rerender } = renderHook(() => useFilterParams());
    const first = result.current;

    rerender();

    expect(result.current.setFilter).toBe(first.setFilter);
    expect(result.current.setFilters).toBe(first.setFilters);
    expect(result.current.clearFilters).toBe(first.clearFilters);
  });

  it("writes one param per value and keeps the others", () => {
    const { result } = renderHook(() => useFilterParams());

    result.current.setFilter("brand", ["Dukat", "Vindija"]);

    expect(navigation.router.replace).toHaveBeenCalledWith(
      "/products?q=mlijeko&chain=lidl&brand=Dukat&brand=Vindija",
      { scroll: false },
    );
  });
});
