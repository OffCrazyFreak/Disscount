import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProductSearchBar from "@/components/custom/search/product-search-bar";
import SearchBar, {
  type ISearchBarProps,
} from "@/components/custom/search/search-bar";
import { productSearchDraft } from "@/components/custom/search/search-draft-store";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CameraScannerProvider } from "@/context/scanner-context";
import { renderWithProviders } from "@/test/render";

const router = vi.hoisted(() => ({
  pathname: "/products",
  search: "",
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(router.search),
}));
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => router.pathname,
  useRouter: () => ({ push: router.push, replace: router.replace }),
}));

function shell(children: React.ReactNode) {
  return (
    <SidebarProvider>
      <CameraScannerProvider>{children}</CameraScannerProvider>
    </SidebarProvider>
  );
}

/** Renders the bar; `landOn` makes a navigation arrive, whenever the test says it does. */
function renderBar(props: Partial<ISearchBarProps> = {}) {
  const bar = () => (
    <SearchBar searchRoute="/products" placeholder="Pretraži" {...props} />
  );
  const { rerender } = renderWithProviders(shell(bar()));

  return {
    field: screen.getByRole("searchbox", { name: "Pretraži" }),
    landOn(search: string) {
      router.search = search;
      rerender(shell(bar()));
    },
  };
}

function renderLiveFilter() {
  router.pathname = "/watchlist";

  return renderBar({
    searchRoute: "/watchlist",
    autoSearch: true,
    submitButtonLocation: "none",
  });
}

function clearButton() {
  return screen.getByRole("button", { name: "Očisti pretragu" });
}

describe("a navigation landing after the field moved on", () => {
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

  describe("after a submit", () => {
    it("keeps what was typed since", async () => {
      const user = userEvent.setup();
      const { field, landOn } = renderBar();

      await user.type(field, "mlijeko{Enter}");
      await user.keyboard(" 2");
      landOn("q=mlijeko");

      expect(field).toHaveValue("mlijeko 2");
    });

    it("keeps it through a second submit's first landing", async () => {
      const user = userEvent.setup();
      const { field, landOn } = renderBar();

      await user.type(field, "sir{Enter}");
      await user.clear(field);
      await user.type(field, "kruh{Enter}");
      landOn("q=sir");

      expect(field).toHaveValue("kruh");

      landOn("q=kruh");

      expect(field).toHaveValue("kruh");
    });

    it("shows the submitted query when nothing was typed since", async () => {
      const user = userEvent.setup();
      const { field, landOn } = renderBar();

      await user.type(field, "  sir {Enter}");
      landOn("q=sir");

      expect(field).toHaveValue("sir");
    });

    it("follows a later URL again once the submit has landed", async () => {
      const user = userEvent.setup();
      const { field, landOn } = renderBar();

      await user.type(field, "sir{Enter}");
      await user.keyboard("a");
      landOn("q=sir");
      landOn("q=kruh");

      expect(field).toHaveValue("kruh");
    });

    it("follows a navigation it did not start, like Back", async () => {
      const user = userEvent.setup();
      const { field, landOn } = renderBar();

      await user.type(field, "sir{Enter}");
      await user.keyboard("a");
      landOn("q=kruh");

      expect(field).toHaveValue("kruh");
    });

    it("mirrors the kept text in every product box", async () => {
      const user = userEvent.setup();
      const boxes = () => (
        <>
          <ProductSearchBar placeholder="Header" submitButtonLocation="none" />
          <ProductSearchBar placeholder="Page" />
        </>
      );
      const { rerender } = renderWithProviders(shell(boxes()));
      const header = screen.getByRole("searchbox", { name: "Header" });
      const page = screen.getByRole("searchbox", { name: "Page" });

      await user.type(header, "sir{Enter}");
      await user.keyboard("a");
      router.search = "q=sir";
      rerender(shell(boxes()));

      expect(header).toHaveValue("sira");
      expect(page).toHaveValue("sira");
    });
  });

  describe("on a live filter", () => {
    it("keeps a clear when an earlier keystroke's URL lands after it", async () => {
      const user = userEvent.setup();
      const { field, landOn } = renderLiveFilter();

      await user.type(field, "c");
      await user.click(clearButton());
      landOn("q=c");

      expect(field).toHaveValue("");
      expect(router.push).toHaveBeenLastCalledWith("/watchlist");
    });

    it("keeps newer keystrokes and sends them again", async () => {
      const user = userEvent.setup();
      const { field, landOn } = renderLiveFilter();

      await user.type(field, "co");
      router.replace.mockClear();
      landOn("q=c");

      expect(field).toHaveValue("co");
      expect(router.replace).toHaveBeenLastCalledWith("/watchlist?q=co");
    });
  });

  describe("Back on a live filter", () => {
    it("stays on the entry from before a clear that has landed", async () => {
      router.search = "q=cok";
      const user = userEvent.setup();
      const { field, landOn } = renderLiveFilter();

      await user.click(clearButton());
      expect(router.push).toHaveBeenCalledExactlyOnceWith("/watchlist");

      landOn("");
      landOn("q=cok");

      expect(field).toHaveValue("cok");
      expect(router.push).toHaveBeenCalledOnce();
    });

    it("stays when a clear has not landed yet", async () => {
      router.search = "q=cok";
      const user = userEvent.setup();
      const { field, landOn } = renderLiveFilter();

      await user.click(clearButton());
      landOn("q=sir");

      expect(field).toHaveValue("sir");
      expect(router.push).toHaveBeenCalledOnce();
    });

    it("does not send keystrokes that had not landed", async () => {
      router.search = "q=cok";
      const user = userEvent.setup();
      const { field, landOn } = renderLiveFilter();

      await user.type(field, "a");
      expect(router.replace).toHaveBeenCalledExactlyOnceWith(
        "/watchlist?q=coka",
      );

      landOn("q=sir");

      expect(field).toHaveValue("sir");
      expect(router.replace).toHaveBeenCalledOnce();
    });
  });
});
