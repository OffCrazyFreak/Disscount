import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";

const KEY_ROUTE = "/indexnow-key/:key";

async function keyFileRewrite() {
  const rewrites = await nextConfig.rewrites?.();

  if (!Array.isArray(rewrites)) {
    throw new Error("next.config.ts rewrites() no longer returns a list");
  }

  const rule = rewrites.find((rewrite) => rewrite.destination === KEY_ROUTE);
  if (!rule) throw new Error(`No rewrite points at ${KEY_ROUTE}`);

  // Next's own matcher, so the test reads the source the way the router does.
  return getPathMatch(rule.source, { strict: true, removeUnnamedParams: true });
}

describe("next.config rewrites", () => {
  it("sends a key file at the site root to the IndexNow key route", async () => {
    const match = await keyFileRewrite();

    expect(match("/a1b2c3d4e5f6a7b8.txt")).toEqual({ key: "a1b2c3d4e5f6a7b8" });
  });

  it.each([
    "/robots.txt",
    "/llms.txt",
    "/en/a1b2c3d4e5f6a7b8.txt",
    "/a1b2c3d4_e5f6.txt",
    `/${"a".repeat(129)}.txt`,
  ])("leaves %s alone", async (path) => {
    const match = await keyFileRewrite();

    expect(match(path)).toBe(false);
  });
});
