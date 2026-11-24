import { http, HttpResponse } from "msw/http";
import { describe, expect, it } from "vitest";

import { listChains } from "@/lib/cijene-api/queries";
import { server } from "@/test/msw-server";

// Named .tsx only for the jsdom project: the language comes from the document.

describe("the price data routes from the browser", () => {
  it("ask in the page's language, not the browser's", async () => {
    const seen: (string | null)[] = [];
    server.use(
      http.get("*/api/cijene/chains", ({ request }) => {
        seen.push(request.headers.get("Accept-Language"));
        return HttpResponse.json({ chains: [] });
      }),
    );
    document.documentElement.lang = "de";

    await listChains();

    expect(seen).toEqual(["de"]);
  });
});
