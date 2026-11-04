import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import ProductsSheetSubmit from "@/app/[locale]/products/components/products-sheet/products-sheet-submit";
import ProductSearchBar from "@/components/custom/search/product-search-bar";
import { productSearchDraft } from "@/components/custom/search/search-draft-store";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CameraScannerProvider } from "@/context/scanner-context";
import { renderWithProviders } from "@/test/render";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/products",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

describe("ProductsSheetSubmit", () => {
  afterEach(() => {
    act(() => productSearchDraft.clear());
  });

  it("lights up for text typed in another product search", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SidebarProvider>
        <CameraScannerProvider>
          <ProductSearchBar placeholder="Page" submitButtonLocation="none" />
          <ProductsSheetSubmit searchRoute="/products" form="sheet-form" />
        </CameraScannerProvider>
      </SidebarProvider>,
    );
    const submit = screen.getByRole("button", { name: "Pretraži" });

    expect(submit).toBeDisabled();

    await user.type(screen.getByRole("searchbox", { name: "Page" }), "kruh");

    expect(submit).toBeEnabled();
  });
});
