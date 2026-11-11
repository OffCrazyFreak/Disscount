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
