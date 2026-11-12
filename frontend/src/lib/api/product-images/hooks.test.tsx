import { QueryClient } from "@tanstack/react-query";
import { act, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw/http";
import { afterEach, describe, expect, it } from "vitest";

import {
  useProductImages,
  useProductThumbnail,
  useUploadProductImage,
} from "@/lib/api/product-images/hooks";
import { createQueryClientConfig } from "@/lib/api/query-client-defaults";
import {
  dismissLimitReached,
  getLimitReached,
} from "@/lib/limits/limit-reached-store";
import { server } from "@/test/msw-server";
import { renderHookWithProviders } from "@/test/render";

// Signed out: the API client asks for a token first and sends the request without one.
describe("useProductThumbnail", () => {
  it("asks for every row of a list in one request", async () => {
    const asked: string[] = [];
    server.use(
      http.get("*/api/products/images/thumbnails", ({ request }) => {
        asked.push(new URL(request.url).searchParams.get("eans") ?? "");
        return HttpResponse.json({
          thumbnails: { "8076800195057": "https://images.test/a-thumb.jpg" },
        });
      }),
    );

    const { result } = renderHookWithProviders(() => ({
      pasta: useProductThumbnail("8076800195057"),
      chips: useProductThumbnail("3856021300547"),
    }));

    await waitFor(() => expect(result.current.chips.isSuccess).toBe(true));
    expect(result.current.pasta.data).toBe("https://images.test/a-thumb.jpg");
    expect(result.current.chips.data).toBeNull();
    expect(asked).toHaveLength(1);
    expect(asked[0].split(",").sort()).toEqual([
      "3856021300547",
      "8076800195057",
    ]);
  });
});

describe("useProductImages", () => {
  it("rejects a payload that does not match the schema", async () => {
    server.use(
      http.get("*/api/products/:ean/images", () =>
        HttpResponse.json({ ean: "1", images: [{ id: 1 }] }),
      ),
    );

    const { result } = renderHookWithProviders(() =>
      useProductImages("8076800195057"),
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useUploadProductImage", () => {
  afterEach(() => act(() => dismissLimitReached()));

  it("opens the limit dialog when the backend refuses a photo over a limit", async () => {
    server.use(
      http.post("*/api/products/:ean/images", () =>
        HttpResponse.json(
          {
            status: 409,
            code: "error.limit.productPhotosPerDay",
            limit: "PRODUCT_PHOTOS_PER_DAY",
            max: 75,
          },
          { status: 409 },
        ),
      ),
    );

    const { result } = renderHookWithProviders(
      () => useUploadProductImage("8076800195057"),
      { queryClient: new QueryClient(createQueryClientConfig()) },
    );
    act(() => result.current.mutate(new Blob(["photo"])));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(getLimitReached()).toMatchObject({
      open: true,
      problem: { limit: "PRODUCT_PHOTOS_PER_DAY", max: 75 },
    });
  });
});
