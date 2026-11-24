import { describe, expect, it } from "vitest";

import { skipNoStore } from "@/lib/pwa/skip-no-store";

function update(cacheControl: string | null) {
  const response = new Response("{}", {
    headers: cacheControl ? { "cache-control": cacheControl } : {},
  });

  return skipNoStore.cacheWillUpdate?.({
    response,
    request: new Request("http://localhost/api/cijene/store-hours"),
    event: new Event("fetch") as ExtendableEvent,
    state: {},
  });
}

describe("skipNoStore", () => {
  it("keeps a response the server marked no-store out of the cache", async () => {
    expect(await update("private, no-store")).toBeNull();
  });

  it.each(["public, max-age=3600, stale-while-revalidate=86400", null])(
    "caches a response with cache-control %s",
    async (cacheControl) => {
      expect(await update(cacheControl)).toBeInstanceOf(Response);
    },
  );
});
