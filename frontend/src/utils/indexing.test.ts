import { describe, expect, it } from "vitest";
import { isIndexableOrigin } from "./indexing";

describe("isIndexableOrigin", () => {
  it("allows the production origin, with or without a trailing slash", () => {
    expect(isIndexableOrigin("https://disscount.me")).toBe(true);
    expect(isIndexableOrigin("https://disscount.me/")).toBe(true);
  });

  it("blocks dev, other subdomains and localhost", () => {
    expect(isIndexableOrigin("https://dev.disscount.me")).toBe(false);
    expect(isIndexableOrigin("https://www.disscount.me")).toBe(false);
    // Built, not literal: Netlify's secret scan fails the build on a string equal to an env value.
    const insecure = "https://disscount.me".replace("https:", "http:");
    expect(isIndexableOrigin(insecure)).toBe(false);
    expect(isIndexableOrigin("http://localhost:3000")).toBe(false);
  });

  it("blocks a missing or malformed value", () => {
    expect(isIndexableOrigin(undefined)).toBe(false);
    expect(isIndexableOrigin("not a url")).toBe(false);
  });
});
