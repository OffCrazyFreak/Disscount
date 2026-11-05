import { router, searchBarShell } from "@/test/search-bar-harness";
import { act, renderHook, screen, within } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProductSearchBar from "@/components/custom/search/product-search-bar";
import { productSearchDraft } from "@/components/custom/search/search-draft-store";
import {
  markProductSearchSubmitted,
  useRecordProductSearch,
} from "@/components/custom/search/use-record-product-search";
import { CIJENE_QUERY_KEYS } from "@/lib/cijene-api/keys";
import { renderWithProviders } from "@/test/render";
import { productRecentSearches } from "@/utils/browser/storage/recent-searches";

vi.mock("@/components/scanner/camera-scanner", () => ({ default: () => null }));

function renderBar(
  submitButtonLocation?: "none" | "auto",
  productNames: string[] = [],
) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(
    CIJENE_QUERY_KEYS.productSearch({ q: "seed", limit: 100 }),
    {
      products: productNames.map((name, index) => ({
        ean: String(index),
        brand: null,
        name,
        quantity: null,
        unit: null,
        chains: [],
      })),
    },
  );

  renderWithProviders(
    searchBarShell(
      <ProductSearchBar
        placeholder="Pretraži"
        submitButtonLocation={submitButtonLocation}
      />,
    ),
    { queryClient },
  );

  return screen.getByRole("combobox", { name: "Pretraži" });
}

// Text only, so a remove cell, which has none, drops out.
function cellNames() {
  return screen
    .queryAllByRole("gridcell")
    .map((cell) => cell.textContent)
    .filter(Boolean);
}

describe("product search suggestions", () => {
  beforeEach(() => {
    router.pathname = "/products";
    router.search = "";
    router.push.mockClear();
  });

  afterEach(() => {
    act(() => {
      productSearchDraft.followRoute("");
      productSearchDraft.clear();
      productRecentSearches.clear();
    });
  });

  it("offers recent searches on an empty field", async () => {
    productRecentSearches.add("kruh");
    productRecentSearches.add("mlijeko");
    const user = userEvent.setup();
    const field = renderBar();

    await user.click(field);

    expect(cellNames()).toEqual(["mlijeko", "kruh"]);
    expect(field).toHaveAttribute("aria-expanded", "true");
  });

  it("removes one recent search and leaves the list open", async () => {
    productRecentSearches.add("kruh");
    productRecentSearches.add("mlijeko");
    const user = userEvent.setup();
    const field = renderBar();

    await user.click(field);
    await user.click(
      screen.getByRole("gridcell", {
        name: "Ukloni iz nedavnih pretraga: kruh",
      }),
    );

    expect(cellNames()).toEqual(["mlijeko"]);
    expect(field).toHaveFocus();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("removes a recent search by keyboard", async () => {
    productRecentSearches.add("mlijeko");
    const user = userEvent.setup();
    const field = renderBar();

    await user.click(field);
    await user.keyboard("{ArrowDown}{ArrowRight}{Enter}");

    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    expect(field).toHaveValue("");
    expect(router.push).not.toHaveBeenCalled();
  });

  it("offers no way to remove a product name", async () => {
    const user = userEvent.setup();
    const field = renderBar("auto", ["Čokolada"]);

    await user.type(field, "cok");

    expect(screen.getAllByRole("gridcell")).toHaveLength(1);
  });

  it("stays closed on an empty field with nothing to offer", async () => {
    const user = userEvent.setup();
    const field = renderBar();

    await user.click(field);

    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("filters loaded product names while typing, without any request", async () => {
    const user = userEvent.setup();
    const field = renderBar("auto", ["Mlijeko 2,8%", "Čokolada", "Kruh"]);

    await user.type(field, "cok");

    expect(cellNames()).toEqual(["Čokolada"]);
    // MSW fails the test on any request nobody declared.
    expect(router.push).not.toHaveBeenCalled();
  });

  it("runs a search when a suggestion is clicked", async () => {
    const user = userEvent.setup();
    const field = renderBar("auto", ["Čokolada"]);

    await user.type(field, "cok");
    await user.click(screen.getByRole("gridcell", { name: "Čokolada" }));

    expect(router.push).toHaveBeenCalledExactlyOnceWith(
      "/products?q=%C4%8Cokolada",
    );
  });

  it("picks the highlighted row with Arrow and Enter, once", async () => {
    const user = userEvent.setup();
    const field = renderBar("auto", ["Čokolada"]);

    await user.type(field, "cok{ArrowDown}");

    const listbox = screen.getByRole("grid");
    const option = within(listbox).getByRole("gridcell");
    expect(field).toHaveAttribute("aria-activedescendant", option.id);

    await user.keyboard("{Enter}");

    expect(router.push).toHaveBeenCalledExactlyOnceWith(
      "/products?q=%C4%8Cokolada",
    );
  });

  it.each(["auto", "none"] as const)(
    "submits the typed text on Enter with no row highlighted (button: %s)",
    async (location) => {
      const user = userEvent.setup();
      const field = renderBar(location, ["Čokolada"]);

      await user.type(field, "cok{Enter}");

      expect(router.push).toHaveBeenCalledExactlyOnceWith("/products?q=cok");
      expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    },
  );

  it("opens only under the field being typed in", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();
    queryClient.setQueryData(
      CIJENE_QUERY_KEYS.productSearch({ q: "seed", limit: 100 }),
      { products: [{ ean: "1", name: "Čokolada", chains: [] }] },
    );
    renderWithProviders(
      searchBarShell(
        <>
          <ProductSearchBar placeholder="Header" submitButtonLocation="none" />
          <ProductSearchBar placeholder="Page" />
        </>,
      ),
      { queryClient },
    );
    const header = screen.getByRole("combobox", { name: "Header" });
    const page = screen.getByRole("combobox", { name: "Page" });

    await user.type(page, "xyz");
    await user.clear(header);
    await user.type(header, "cok");

    expect(screen.getAllByRole("grid")).toHaveLength(1);
    expect(header).toHaveAttribute("aria-expanded", "true");
    expect(page).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on Escape and keeps the text", async () => {
    const user = userEvent.setup();
    const field = renderBar("auto", ["Čokolada"]);

    await user.type(field, "cok");
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    expect(field).toHaveValue("cok");

    await user.keyboard("{Escape}");

    expect(field).toHaveValue("cok");
    expect(router.push).not.toHaveBeenCalled();
  });
});

describe("recording product searches", () => {
  afterEach(() => {
    act(() => productRecentSearches.clear());
    markProductSearchSubmitted("");
  });

  function stored() {
    return JSON.parse(localStorage.getItem("Disscount_app") ?? "{}")
      .productRecentSearches;
  }

  it("records a submitted search once it has results", () => {
    markProductSearchSubmitted("kruh");
    const { rerender } = renderHook(
      ({ hasResults }) => useRecordProductSearch("kruh", hasResults),
      { initialProps: { hasResults: false } },
    );

    expect(stored()).toBeUndefined();

    rerender({ hasResults: true });

    expect(stored()).toEqual(["kruh"]);
  });

  it("ignores a query nobody submitted, such as a shared link", () => {
    renderHook(() => useRecordProductSearch("kruh", true));

    expect(stored()).toBeUndefined();
  });

  it("drops duplicates whatever the case and caps the list", () => {
    ["a", "b", "c", "d", "e", "f", "A"].forEach(productRecentSearches.add);

    expect(stored()).toEqual(["A", "f", "e", "d", "c"]);
  });
});
