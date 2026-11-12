import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";

interface IHeaderRule {
  source: string;
  has?: { type: string; key: string }[];
  headers: { key: string; value: string }[];
}

function referrerPolicyOf(rule: IHeaderRule | undefined) {
  return rule?.headers.find((header) => header.key === "Referrer-Policy")
    ?.value;
}

async function referrerRules() {
  if (!nextConfig.headers) throw new Error("next.config.ts has no headers()");

  const rules = (await nextConfig.headers()) as IHeaderRule[];

  const globalIndex = rules.findIndex(
    (rule) => rule.source === "/:path*" && !rule.has && referrerPolicyOf(rule),
  );

  const tokenQueryIndex = rules.findIndex((rule) =>
    rule.has?.some(
      (condition) => condition.type === "query" && condition.key === "token",
    ),
  );

  const resetRouteIndex = rules.findIndex((rule) =>
    rule.source.endsWith("/reset-password"),
  );

  return { rules, globalIndex, tokenQueryIndex, resetRouteIndex };
}

describe("next.config.ts referrer policy", () => {
  it("defaults every response to strict-origin-when-cross-origin", async () => {
    const { rules, globalIndex } = await referrerRules();

    expect(referrerPolicyOf(rules[globalIndex])).toBe(
      "strict-origin-when-cross-origin",
    );
  });

  // Next applies every matching rule in order, so the last one sets the header.
  it("sends no referrer from any URL with a token query", async () => {
    const { rules, globalIndex, tokenQueryIndex } = await referrerRules();

    expect(rules[tokenQueryIndex]?.source).toBe("/:path*");
    expect(referrerPolicyOf(rules[tokenQueryIndex])).toBe("no-referrer");
    expect(tokenQueryIndex).toBeGreaterThan(globalIndex);
  });

  it("sends no referrer from the reset password route in every locale", async () => {
    const { rules, globalIndex, resetRouteIndex } = await referrerRules();

    expect(rules[resetRouteIndex]?.source).toBe(
      "/:locale(en|it|sl|de)?/reset-password",
    );
    expect(rules[resetRouteIndex]?.has).toBeUndefined();
    expect(referrerPolicyOf(rules[resetRouteIndex])).toBe("no-referrer");
    expect(resetRouteIndex).toBeGreaterThan(globalIndex);
  });
});

async function headersFor(path: string): Promise<Map<string, string>> {
  const rules = (await nextConfig.headers?.()) ?? [];
  const matching = new Map<string, string>();

  for (const rule of rules) {
    // A plain path carries no query, so a rule that needs one never applies here.
    if ("has" in rule && rule.has) continue;
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
