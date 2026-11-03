import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { BACKEND_ROOTS, backendUrl } from "@/lib/backend-proxy/backend-path";

const BACKEND = "http://backend:8080";

describe("backendUrl", () => {
  it("rebuilds the path under /api on the backend origin, keeping the query", () => {
    expect(
      backendUrl(["products", "385 1"], "?q=mlijeko&page=2", BACKEND)?.href,
    ).toBe("http://backend:8080/api/products/385%201?q=mlijeko&page=2");
  });

  it("refuses a root Spring does not serve", () => {
    expect(backendUrl(["actuator", "env"], "", BACKEND)).toBeNull();
  });
});

describe("Next routes under app/api", () => {
  it("never take a path the proxy forwards to Spring", () => {
    // A Next route beats the catch-all, so a folder named like a backend root would silently steal its calls.
    const apiFolder = fileURLToPath(new URL("../../app/api", import.meta.url));
    const nextRoutes = readdirSync(apiFolder).filter(
      (name) => name !== "[...path]",
    );

    expect(nextRoutes.filter((name) => BACKEND_ROOTS.has(name))).toEqual([]);
  });

  it("keep account data out of the service worker's /api/cijene/ cache", () => {
    // app/sw.ts caches /api/cijene/ GETs in Cache Storage for every account on the device.
    expect(BACKEND_ROOTS.has("cijene")).toBe(false);
  });
});
