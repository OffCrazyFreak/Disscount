import { waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw/http";
import { describe, expect, it } from "vitest";

import {
  useProductImages,
  useProductThumbnail,
} from "@/lib/api/product-images/hooks";
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
