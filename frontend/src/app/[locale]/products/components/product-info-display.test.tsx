import { waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw/http";
import { describe, expect, it, vi } from "vitest";

import ProductInfoDisplay from "@/app/[locale]/products/components/product-info-display";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";
import { product } from "@/test/price-fixtures";

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

const PASTA = "8076800195057";
const CHIPS = "3856021300547";
const PASTA_URL = "https://images.test/pasta-thumb.jpg";

function photoBox(container: HTMLElement) {
  return container.querySelector(
    'img, [data-slot="product-thumbnail-placeholder"]',
  );
}

describe("ProductInfoDisplay inside a modal", () => {
  it("keeps the photo box for a product without a photo, so the header never shifts", async () => {
    server.use(
      http.get("*/api/products/images/thumbnails", () =>
        HttpResponse.json({ thumbnails: {} }),
      ),
    );

    const { container } = renderWithProviders(
      <ProductInfoDisplay
        product={product([], { ean: CHIPS, name: "Barilla Spaghetti Nº5" })}
        enableActionButtons={false}
      />,
    );

    expect(photoBox(container)).not.toBeNull();
    await waitFor(() =>
      expect(
        container.querySelector(
          '[data-slot="product-thumbnail-placeholder"] svg',
        ),
      ).not.toBeNull(),
    );
  });

  it("shows the photo as decoration next to the product name", async () => {
    server.use(
      http.get("*/api/products/images/thumbnails", () =>
        HttpResponse.json({ thumbnails: { [PASTA]: PASTA_URL } }),
      ),
    );

    const { container } = renderWithProviders(
      <ProductInfoDisplay
        product={product([], { ean: PASTA, name: "Barilla Spaghetti Nº5" })}
        enableActionButtons={false}
      />,
    );

    const photo = await waitFor(() => {
      const img = container.querySelector("img");
      expect(img).not.toBeNull();
      return img!;
    });
    expect(photo.getAttribute("src")).toBe(PASTA_URL);
    expect(photo.getAttribute("alt")).toBe("");
  });
});
