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

const signedOut = http.get("*/api/auth/token", () =>
  HttpResponse.json(null, { status: 401 }),
);

function photos(images: object[]) {
  return http.get("*/api/products/:ean/images", () =>
    HttpResponse.json({ ean: "8076800195057", images }),
  );
}

describe("ProductPhotoGallery", () => {
  it("invites a signed-out visitor to sign in before adding the first photo", async () => {
    server.use(signedOut, photos([]));
    const user = userEvent.setup();

    renderWithProviders(
      <ProductPhotoGallery
        ean="8076800195057"
        productName="Barilla Spaghetti Nº5"
      />,
    );

    expect(await screen.findByText("Još nema slike")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Dodaj sliku" }));
    expect(mocks.openModalUrl).toHaveBeenCalledWith({ name: "login" });
    expect(
      screen.queryByRole("button", { name: "Uredi slike" }),
    ).not.toBeInTheDocument();
  });

  it("shows the main photo as a button that opens the viewer, badged while unverified", async () => {
    server.use(
      signedOut,
      photos([
        {
          id: "a",
          fullUrl: "https://images.test/a.jpg",
          thumbUrl: "https://images.test/a-t.jpg",
          source: "USER",
          status: "PENDING",
        },
        {
          id: "b",
          fullUrl: "https://images.test/b.jpg",
          thumbUrl: "https://images.test/b-t.jpg",
          source: "OPEN_FOOD_FACTS",
          status: "VERIFIED",
        },
      ]),
    );

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
      "https://images.test/a-t.jpg",
    );
    expect(screen.getByText("Nepotvrđena slika")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Prikaži sliku 2 od 2" }),
    ).toBeInTheDocument();
  });
});
