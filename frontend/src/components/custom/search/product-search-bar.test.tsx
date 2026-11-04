import { router, searchBarShell } from "@/test/search-bar-harness";
import type { ReactNode } from "react";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProductSearchBar from "@/components/custom/search/product-search-bar";
import SearchBar from "@/components/custom/search/search-bar";
import { productSearchDraft } from "@/components/custom/search/search-draft-store";
import { renderWithProviders } from "@/test/render";

function renderShell(children: ReactNode) {
  return renderWithProviders(searchBarShell(children));
}

function ProductBoxes() {
  return (
    <>
      <div data-testid="header">
        <ProductSearchBar placeholder="Header" submitButtonLocation="none" />
      </div>
      <div data-testid="page">
        <ProductSearchBar placeholder="Page" />
      </div>
    </>
  );
}

function field(name: string) {
  return screen.getByRole("searchbox", { name });
}

function pageButton() {
  return within(screen.getByTestId("page")).getByRole("button", {
    name: "Pretraži",
  });
}

describe("ProductSearchBar", () => {
  beforeEach(() => {
    router.pathname = "/products";
    router.search = "";
    router.push.mockClear();
    router.replace.mockClear();
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    // The clear button's tooltip measures itself when focus opens it.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  // The store outlives a test, so hand the next one an empty draft on an empty URL.
  afterEach(() => {
    act(() => {
      productSearchDraft.followRoute("");
      productSearchDraft.clear();
    });
  });

  it("searches what was typed in the header from the page's button", async () => {
    router.search = "q=sir";
    const user = userEvent.setup();
    renderShell(<ProductBoxes />);

    await user.clear(field("Header"));
    await user.type(field("Header"), "kruh");

    expect(field("Page")).toHaveValue("kruh");

    await user.click(pageButton());

    expect(router.push).toHaveBeenCalledExactlyOnceWith("/products?q=kruh");
  });

  it("wakes up a button whose own field was empty", async () => {
    const user = userEvent.setup();
    renderShell(<ProductBoxes />);

    expect(pageButton()).toBeDisabled();

    await user.type(field("Header"), "kruh");

    expect(pageButton()).toBeEnabled();
  });

  it("searches what was typed in the page from Enter in the header", async () => {
    const user = userEvent.setup();
    renderShell(<ProductBoxes />);

    await user.type(field("Page"), "kruh");
    await user.type(field("Header"), "{Enter}");

    expect(router.push).toHaveBeenCalledExactlyOnceWith("/products?q=kruh");
  });

  it("does not search or touch the URL while typing", async () => {
    const user = userEvent.setup();
    renderShell(<ProductBoxes />);

    await user.type(field("Header"), "kruh");

    expect(router.push).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("fills a field that mounts after the typing, like the opened sheet", async () => {
    const user = userEvent.setup();
    const { rerender } = renderShell(
      <ProductSearchBar placeholder="Header" submitButtonLocation="none" />,
    );

    await user.type(field("Header"), "kruh");
    rerender(
      searchBarShell(
        <>
          <ProductSearchBar placeholder="Header" submitButtonLocation="none" />
          <ProductSearchBar placeholder="Sheet" submitButtonLocation="none" />
        </>,
      ),
    );

    expect(field("Sheet")).toHaveValue("kruh");
  });

  describe("clearing", () => {
    function clearButton(boxId: string) {
      return within(screen.getByTestId(boxId)).getByRole("button", {
        name: "Očisti pretragu",
      });
    }

    it("clears every box from any one of them", async () => {
      const user = userEvent.setup();
      renderShell(<ProductBoxes />);

      await user.type(field("Page"), "kruh");
      await user.click(clearButton("header"));

      expect(field("Header")).toHaveValue("");
      expect(field("Page")).toHaveValue("");
      expect(field("Header")).toHaveFocus();
      expect(router.push).not.toHaveBeenCalled();
    });

    it("drops the URL's query once, not once per box", async () => {
      router.search = "q=sir";
      const user = userEvent.setup();
      renderShell(<ProductBoxes />);

      await user.click(clearButton("page"));

      expect(field("Header")).toHaveValue("");
      expect(router.push).toHaveBeenCalledExactlyOnceWith("/products");
    });

    it("keeps what was typed everywhere while the URL catches up", async () => {
      router.search = "q=sir";
      const user = userEvent.setup();
      renderShell(<ProductBoxes />);

      await user.click(clearButton("header"));
      await user.keyboard("k");
      router.search = "";
      await user.keyboard("r");

      expect(field("Header")).toHaveValue("kr");
      expect(field("Page")).toHaveValue("kr");
    });

    it("searches what is typed after a clear", async () => {
      router.search = "q=sir";
      const user = userEvent.setup();
      renderShell(<ProductBoxes />);

      await user.click(clearButton("header"));
      await user.keyboard("kruh");
      await user.click(pageButton());

      expect(router.push).toHaveBeenLastCalledWith("/products?q=kruh");
    });
  });

  it("drops a draft when the URL moves to another search", async () => {
    router.search = "q=sir";
    const user = userEvent.setup();
    renderShell(<ProductBoxes />);

    await user.type(field("Header"), "x");
    router.search = "q=mlijeko";
    await user.type(field("Header"), "y");

    expect(field("Header")).toHaveValue("mlijeko");
    expect(field("Page")).toHaveValue("mlijeko");
  });

  describe("a local filter", () => {
    function renderWithFilter() {
      router.pathname = "/watchlist";
      renderShell(
        <>
          <ProductSearchBar placeholder="Header" submitButtonLocation="none" />
          <SearchBar
            placeholder="Watchlist"
            searchRoute="/watchlist"
            submitButtonLocation="none"
            autoSearch
          />
        </>,
      );
    }

    it("does not pick up what is typed in a product search", async () => {
      const user = userEvent.setup();
      renderWithFilter();

      await user.type(field("Header"), "kruh");

      expect(field("Watchlist")).toHaveValue("");
      expect(router.replace).not.toHaveBeenCalled();
    });

    it("does not pass its own text to a product search", async () => {
      const user = userEvent.setup();
      renderWithFilter();

      await user.type(field("Watchlist"), "cok");

      expect(field("Header")).toHaveValue("");
      expect(router.replace).toHaveBeenLastCalledWith("/watchlist?q=cok");
    });
  });
});
