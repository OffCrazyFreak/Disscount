import { describe, expect, it } from "vitest";

import {
  isShoppingListPath,
  scrubBreadcrumbOnPage,
} from "@/lib/sentry/shopping-list-privacy";

describe("isShoppingListPath", () => {
  it("matches the index and list pages in every locale", () => {
    expect(isShoppingListPath("/shopping-lists")).toBe(true);
    expect(isShoppingListPath("/en/shopping-lists")).toBe(true);
    expect(isShoppingListPath("/de/shopping-lists/abc")).toBe(true);
  });

  it("leaves other pages alone", () => {
    expect(isShoppingListPath("/shopping-lists-guide")).toBe(false);
    expect(isShoppingListPath("/products")).toBe(false);
  });
});

describe("scrubBreadcrumbOnPage", () => {
  const click = {
    category: "ui.click",
    message: 'button[aria-label="Mark Mlijeko as bought"]',
  };

  it("drops click breadcrumbs on list pages", () => {
    expect(scrubBreadcrumbOnPage(click, "/shopping-lists/abc")).toBeNull();
  });

  it("keeps click breadcrumbs elsewhere and other breadcrumbs on list pages", () => {
    expect(scrubBreadcrumbOnPage(click, "/products")).toEqual(click);
    expect(
      scrubBreadcrumbOnPage(
        { category: "fetch", data: { url: "/api/x?token=abc" } },
        "/shopping-lists/abc",
      ),
    ).toEqual({ category: "fetch", data: { url: "/api/x?token=[Filtered]" } });
  });
});
