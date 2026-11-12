import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  BACKEND_ROOTS,
  backendUrl,
  docsUrl,
} from "@/lib/backend-proxy/backend-path";

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

describe("docsUrl", () => {
  it.each([
    [["v3", "api-docs"], "http://backend:8080/api/v3/api-docs"],
    [
      ["v3", "api-docs", "swagger-config"],
      "http://backend:8080/api/v3/api-docs/swagger-config",
    ],
    [
      ["swagger-ui", "index.html"],
      "http://backend:8080/api/swagger-ui/index.html",
    ],
  ])("maps %j to springdoc's own path", (segments, href) => {
    expect(docsUrl(segments, "", BACKEND)?.href).toBe(href);
  });

  it.each([
    ["an API root", ["users", "me"]],
    ["another v3 path", ["v3", "users"]],
    ["a dot segment", ["swagger-ui", "..", "users"]],
    ["a decoded slash", ["swagger-ui", "../users/me"]],
  ])("refuses %s", (_, segments) => {
    expect(docsUrl(segments, "", BACKEND)).toBeNull();
  });
});

// Each one forwards every method Spring serves on its path; the admin delete removes the login after Spring's erase.
const DELIBERATE_SHADOWS = ["admin/users/[userId]/route.ts"];

describe("Next routes under app/api", () => {
  it("never take a path the proxy forwards to Spring, except the deliberate ones", () => {
    // A Next route beats the catch-all, so a folder named like a backend root would silently steal its calls.
    const apiFolder = fileURLToPath(new URL("../../app/api", import.meta.url));
    const shadowingFiles = readdirSync(apiFolder)
      .filter((name) => BACKEND_ROOTS.has(name))
      .flatMap((root) =>
        readdirSync(`${apiFolder}/${root}`, {
          recursive: true,
          encoding: "utf8",
        })
          .filter((file) => /(^|\/)route\.[jt]s$/.test(file))
          .map((file) => `${root}/${file}`),
      );

    expect(shadowingFiles).toEqual(DELIBERATE_SHADOWS);
  });

  it("keep account data out of the service worker's /api/cijene/ cache", () => {
    // app/sw.ts caches /api/cijene/ GETs in Cache Storage for every account on the device.
    expect(BACKEND_ROOTS.has("cijene")).toBe(false);
  });
});
