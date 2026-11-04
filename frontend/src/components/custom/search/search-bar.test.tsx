import { router, searchBarShell } from "@/test/search-bar-harness";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SearchBar from "@/components/custom/search/search-bar";
import { renderWithProviders } from "@/test/render";

// Boundaries the suite cannot run: the App Router and the camera.
vi.mock("@/components/scanner/camera-scanner", () => ({ default: () => null }));
function stubPointer(isCoarse: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(pointer: coarse)" ? isCoarse : false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

// The clear button's tooltip measures itself when focus opens it.
function stubResizeObserver() {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
}

function renderSearchBar(
  submitButtonLocation?: "none" | "auto" | "block",
  autoSearch = false,
  searchRoute = "/products",
) {
  renderWithProviders(
    searchBarShell(
      <SearchBar
        searchRoute={searchRoute}
        placeholder="Pretraži"
        submitButtonLocation={submitButtonLocation}
        autoSearch={autoSearch}
      />,
    ),
  );

  return screen.getByRole("searchbox", { name: "Pretraži" });
}

describe("SearchBar", () => {
  beforeEach(() => {
    router.pathname = "/products";
    router.search = "";
    router.push.mockClear();
    router.replace.mockClear();
  });

  it("closes the touch keyboard when Enter submits the search", async () => {
    stubPointer(true);
    const user = userEvent.setup();
    const field = renderSearchBar();

    await user.type(field, "mlijeko{Enter}");

    expect(field).not.toHaveFocus();
  });

  it("keeps focus in the field on a device with a fine pointer", async () => {
    stubPointer(false);
    const user = userEvent.setup();
    const field = renderSearchBar();

    await user.type(field, "mlijeko{Enter}");

    expect(field).toHaveFocus();
  });

  it("closes the touch keyboard on Enter over the query already searched", async () => {
    router.search = "q=mlijeko";
    stubPointer(true);
    const user = userEvent.setup();
    const field = renderSearchBar();

    await user.click(field);
    await user.keyboard("{Enter}");

    expect(field).not.toHaveFocus();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("does not search again on Enter over the same query once scrolled", async () => {
    router.search = "q=mlijeko";
    stubPointer(true);
    // Past the back to top threshold the disabled button becomes a plain button.
    vi.stubGlobal("scrollY", 700);
    const user = userEvent.setup();
    const field = renderSearchBar();

    await user.click(field);
    await user.keyboard("{Enter}");

    expect(field).not.toHaveFocus();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("still clears the search on Enter over the clear button on a touch device", async () => {
    router.search = "q=mlijeko";
    stubPointer(true);
    const user = userEvent.setup();
    stubResizeObserver();
    renderSearchBar();

    screen.getByRole("button", { name: "Očisti pretragu" }).focus();
    await user.keyboard("{Enter}");

    expect(router.push).toHaveBeenCalledWith("/products");
  });

  it("keeps searching on Enter over the same query in a bar with no button", async () => {
    router.search = "q=mlijeko";
    stubPointer(true);
    const user = userEvent.setup();
    const field = renderSearchBar("none");

    await user.click(field);
    await user.keyboard("{Enter}");

    expect(router.push).toHaveBeenCalledWith("/products?q=mlijeko");
  });

  describe("clearing", () => {
    function clearButton() {
      return screen.getByRole("button", { name: "Očisti pretragu" });
    }

    beforeEach(() => {
      stubPointer(false);
      stubResizeObserver();
    });

    it("empties the field, keeps focus in it and drops the query from the URL", async () => {
      router.search = "q=mlijeko";
      const user = userEvent.setup();
      const field = renderSearchBar();

      await user.click(clearButton());

      expect(field).toHaveValue("");
      expect(field).toHaveFocus();
      expect(router.push).toHaveBeenCalledWith("/products");
    });

    it("searches what is typed after a clear", async () => {
      router.search = "q=mlijeko";
      const user = userEvent.setup();
      const field = renderSearchBar();

      await user.click(clearButton());
      await user.keyboard("kruh");

      expect(field).toHaveValue("kruh");
      expect(screen.getByRole("button", { name: "Pretraži" })).toBeEnabled();

      await user.keyboard("{Enter}");

      expect(router.push).toHaveBeenLastCalledWith("/products?q=kruh");
    });

    it("keeps filtering live after a clear", async () => {
      router.pathname = "/watchlist";
      router.search = "q=cok";
      const user = userEvent.setup();
      const field = renderSearchBar("none", true, "/watchlist");

      await user.click(clearButton());
      expect(field).toHaveValue("");

      expect(router.push).toHaveBeenCalledExactlyOnceWith("/watchlist");

      await user.keyboard("m");

      expect(router.replace).toHaveBeenLastCalledWith("/watchlist?q=m");
    });

    it("keeps what was typed while the URL catches up with the clear", async () => {
      router.search = "q=mlijeko";
      const user = userEvent.setup();
      const field = renderSearchBar();

      await user.click(clearButton());
      await user.keyboard("k");
      router.search = "";
      await user.keyboard("r");

      expect(field).toHaveValue("kr");
    });

    it("still follows the URL after the clear has landed", async () => {
      router.search = "q=mlijeko";
      const user = userEvent.setup();
      const field = renderSearchBar();

      await user.click(clearButton());
      router.search = "q=sir";
      await user.keyboard("k");
      router.search = "";
      await user.keyboard("r");

      expect(field).toHaveValue("");
    });

    it("stays on the current page when the field searches another one", async () => {
      router.pathname = "/watchlist";
      const user = userEvent.setup();
      const field = renderSearchBar("none");

      await user.type(field, "sir");
      await user.click(clearButton());

      expect(field).toHaveValue("");
      expect(field).toHaveFocus();
      expect(router.push).not.toHaveBeenCalled();
    });
  });

  describe("submitting nothing", () => {
    beforeEach(() => {
      stubPointer(false);
    });

    it("ignores only spaces, leaving the page alone", async () => {
      router.pathname = "/watchlist";
      const user = userEvent.setup();
      const field = renderSearchBar("none");

      await user.type(field, "   {Enter}");

      expect(router.push).not.toHaveBeenCalled();
    });

    it("ignores only spaces over a searched page too", async () => {
      router.search = "q=mlijeko";
      const user = userEvent.setup();
      const field = renderSearchBar("none");

      await user.clear(field);
      await user.type(field, "   {Enter}");

      expect(router.push).not.toHaveBeenCalled();
    });

    it("still closes the touch keyboard, without searching", async () => {
      stubPointer(true);
      router.pathname = "/watchlist";
      const user = userEvent.setup();
      const field = renderSearchBar("none");

      await user.type(field, "   {Enter}");

      expect(field).not.toHaveFocus();
      expect(router.push).not.toHaveBeenCalled();
    });

    it("ignores an empty field on another page", async () => {
      router.pathname = "/watchlist";
      const user = userEvent.setup();
      const field = renderSearchBar("none");

      await user.type(field, "{Enter}");

      expect(router.push).not.toHaveBeenCalled();
    });

    it("drops the query when a searched field is emptied by hand", async () => {
      router.search = "q=mlijeko";
      const user = userEvent.setup();
      const field = renderSearchBar("none");

      await user.clear(field);
      await user.keyboard("{Enter}");

      expect(router.push).toHaveBeenCalledWith("/products");
    });
  });
});
