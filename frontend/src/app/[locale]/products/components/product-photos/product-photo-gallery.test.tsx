import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw/http";
import { describe, expect, it, vi } from "vitest";

import ProductPhotoGallery from "@/app/[locale]/products/components/product-photos/product-photo-gallery";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";

const mocks = vi.hoisted(() => ({ openModalUrl: vi.fn() }));

vi.mock("@/context/user-context", () => ({
  useUser: () => ({ user: null, isLoading: false }),
}));
vi.mock("@/lib/modal/modal-navigation", () => ({
  openModalUrl: mocks.openModalUrl,
}));

function photo(id: string, status = "VERIFIED") {
  return {
    id,
    fullUrl: `https://images.test/${id}.webp`,
    thumbUrl: `https://images.test/${id}-t.webp`,
    smallUrl: `https://images.test/${id}-s.webp`,
    source: "USER",
    status,
  };
}

function photos(images: object[]) {
  return http.get("*/api/products/:ean/images", () =>
    HttpResponse.json({ ean: "8076800195057", images }),
  );
}

describe("ProductPhotoGallery", () => {
  it("invites a signed-out visitor to sign in before adding the first photo", async () => {
    server.use(photos([]));
    const user = userEvent.setup();

    renderWithProviders(
      <ProductPhotoGallery
        ean="8076800195057"
        productName="Barilla Spaghetti Nº5"
      />,
    );

    await user.click(
      await screen.findByRole("button", { name: "Dodaj sliku" }),
    );
    expect(mocks.openModalUrl).toHaveBeenCalledWith({ name: "login" });
    expect(
      screen.queryByRole("button", { name: "Uredi slike" }),
    ).not.toBeInTheDocument();
  });

  it("puts the small main photo in the open button, badged while unverified", async () => {
    server.use(photos([photo("a", "PENDING"), photo("b")]));

    renderWithProviders(
      <ProductPhotoGallery
        ean="8076800195057"
        productName="Barilla Spaghetti Nº5"
      />,
    );

    const open = await screen.findByRole("button", {
      name: "Otvori slike: Barilla Spaghetti Nº5",
    });
    expect(open.querySelector("img")).toHaveAttribute(
      "src",
      "https://images.test/a-s.webp",
    );
    expect(screen.getByText("Nepotvrđena slika")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Prikaži sliku 2 od 2" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Dodaj sliku" }),
    ).toBeInTheDocument();
  });

  it("leaves the add button to the viewer when there is only the main photo", async () => {
    server.use(photos([photo("a")]));

    renderWithProviders(
      <ProductPhotoGallery
        ean="8076800195057"
        productName="Barilla Spaghetti Nº5"
      />,
    );

    await screen.findByRole("button", {
      name: "Otvori slike: Barilla Spaghetti Nº5",
    });
    expect(
      screen.queryByRole("button", { name: "Dodaj sliku" }),
    ).not.toBeInTheDocument();
  });

  it("counts the photos past the strip on its last tile, and all extra photos on the badge", async () => {
    server.use(
      photos(["a", "b", "c", "d", "e", "f", "g"].map((id) => photo(id))),
    );

    renderWithProviders(
      <ProductPhotoGallery
        ean="8076800195057"
        productName="Barilla Spaghetti Nº5"
      />,
    );

    const last = await screen.findByRole("button", {
      name: "Prikaži sliku 3 od 7",
    });
    expect(last).toHaveTextContent("+5");
    expect(
      screen.queryByRole("button", { name: "Prikaži sliku 4 od 7" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("+6")).toBeInTheDocument();
  });
});
