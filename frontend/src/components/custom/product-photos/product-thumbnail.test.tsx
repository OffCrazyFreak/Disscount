import { onlineManager } from "@tanstack/react-query";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw/http";
import { describe, expect, it } from "vitest";

import ProductThumbnail from "@/components/custom/product-photos/product-thumbnail";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";

const PASTA = "8076800195057";
const CHIPS = "3856021300547";
const PASTA_URL = "https://images.test/pasta-thumb.jpg";

function answerThumbnails(asked: string[] = []) {
  server.use(
    http.get("*/api/products/images/thumbnails", ({ request }) => {
      asked.push(new URL(request.url).searchParams.get("eans") ?? "");
      return HttpResponse.json({ thumbnails: { [PASTA]: PASTA_URL } });
    }),
  );
  return asked;
}

function placeholders(container: HTMLElement) {
  return container.querySelectorAll(
    '[data-slot="product-thumbnail-placeholder"]',
  );
}

describe("ProductThumbnail", () => {
  it("asks for a whole list of rows in one request", async () => {
    const asked = answerThumbnails();

    const { container } = renderWithProviders(
      <>
        <ProductThumbnail ean={PASTA} />
        <ProductThumbnail ean={CHIPS} />
        <ProductThumbnail ean={PASTA} />
      </>,
    );

    await waitFor(() =>
      expect(container.querySelectorAll("img")).toHaveLength(2),
    );
    expect(asked).toHaveLength(1);
    expect(asked[0].split(",").sort()).toEqual([CHIPS, PASTA]);
  });

  it("shows a decorative, lazy photo and the placeholder for a product without one", async () => {
    answerThumbnails();

    const { container } = renderWithProviders(
      <>
        <ProductThumbnail ean={PASTA} />
        <ProductThumbnail ean={CHIPS} />
      </>,
    );

    const photo = await waitFor(() => {
      const img = container.querySelector("img");
      expect(img).not.toBeNull();
      return img!;
    });
    expect(photo.getAttribute("src")).toBe(PASTA_URL);
    expect(photo.getAttribute("alt")).toBe("");
    expect(photo.getAttribute("loading")).toBe("lazy");
    await waitFor(() =>
      expect(placeholders(container)[0].querySelector("svg")).not.toBeNull(),
    );
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("falls back to the placeholder when the photo fails to load", async () => {
    answerThumbnails();

    const { container } = renderWithProviders(<ProductThumbnail ean={PASTA} />);

    const photo = await waitFor(() => {
      const img = container.querySelector("img");
      expect(img).not.toBeNull();
      return img!;
    });
    fireEvent.error(photo);

    expect(container.querySelector("img")).toBeNull();
    expect(placeholders(container)).toHaveLength(1);
  });

  it("tries a photo lost offline again once the connection returns", async () => {
    answerThumbnails();

    const { container } = renderWithProviders(<ProductThumbnail ean={PASTA} />);

    const photo = await waitFor(() => {
      const img = container.querySelector("img");
      expect(img).not.toBeNull();
      return img!;
    });
    act(() => onlineManager.setOnline(false));
    fireEvent.error(photo);
    expect(container.querySelector("img")).toBeNull();

    act(() => onlineManager.setOnline(true));
    expect(container.querySelector("img")?.getAttribute("src")).toBe(PASTA_URL);
  });

  it("shows the placeholder for a typed item without asking", () => {
    const { container } = renderWithProviders(<ProductThumbnail ean={null} />);

    expect(placeholders(container)[0].querySelector("svg")).not.toBeNull();
  });

  it("shows the placeholder when the request fails, as it does offline", async () => {
    server.use(
      http.get("*/api/products/images/thumbnails", () => HttpResponse.error()),
    );

    const { container } = renderWithProviders(<ProductThumbnail ean={PASTA} />);

    await waitFor(() =>
      expect(placeholders(container)[0].querySelector("svg")).not.toBeNull(),
    );
    expect(container.querySelector("img")).toBeNull();
  });
});
