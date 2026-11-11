import { describe, expect, it } from "vitest";

import nextConfig from "../next.config";

async function headersFor(path: string): Promise<Map<string, string>> {
  const rules = (await nextConfig.headers?.()) ?? [];
  const matching = new Map<string, string>();

  for (const rule of rules) {
    if (!matchesSource(rule.source, path)) continue;

    for (const { key, value } of rule.headers) matching.set(key, value);
  }

  return matching;
}

/** Enough of Next's path-to-regexp syntax for the rules in next.config.ts. */
function matchesSource(source: string, path: string): boolean {
  const pattern = source
    .replace(/\/:path\*/g, "(?:/.*)?")
    .replace(/:locale\(([^)]*)\)\?/g, "(?:$1)?");

  return new RegExp(`^${pattern}$`).test(path);
}

describe("next.config headers", () => {
  it("lets the scanner use the camera and near-me the location, and nothing else sensitive", async () => {
    const policy = (await headersFor("/")).get("Permissions-Policy");

    expect(policy?.split(", ")).toEqual([
      "camera=(self)",
      "geolocation=(self)",
      "microphone=()",
      "payment=()",
      "usb=()",
      "bluetooth=()",
      "accelerometer=()",
      "gyroscope=()",
      "magnetometer=()",
    ]);
  });

  it("isolates every page from cross-origin openers", async () => {
    for (const path of ["/", "/en/scanner", "/api/contact"]) {
      expect((await headersFor(path)).get("Cross-Origin-Opener-Policy")).toBe(
        "same-origin",
      );
    }
  });

  it("does not announce the framework", () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  it("gives Swagger UI its own policy and leaves the site policy off the API", async () => {
    const docs = await headersFor("/api/swagger-ui/index.html");
    const api = await headersFor("/api/contact");
    const page = await headersFor("/");

    expect(docs.get("Content-Security-Policy")).toContain("script-src 'self';");
    expect(docs.get("Content-Security-Policy")).not.toContain("unsafe-eval");
    expect(api.has("Content-Security-Policy")).toBe(false);
    expect(page.get("Content-Security-Policy")).toContain(
      "https://cloud.umami.is",
    );
  });
});
