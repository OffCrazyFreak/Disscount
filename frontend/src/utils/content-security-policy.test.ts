import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy } from "./content-security-policy";

function scriptSources(policy: string): string[] {
  const directive = policy
    .split("; ")
    .find((part) => part.startsWith("script-src "));

  return directive?.split(" ").slice(1) ?? [];
}

describe("buildContentSecurityPolicy", () => {
  it("allows no eval in production but keeps WebAssembly for the scanner", () => {
    const sources = scriptSources(buildContentSecurityPolicy(false));

    expect(sources).not.toContain("'unsafe-eval'");
    expect(sources).toContain("'wasm-unsafe-eval'");
  });

  it("allows eval in development, which React's dev build needs", () => {
    expect(scriptSources(buildContentSecurityPolicy(true))).toContain(
      "'unsafe-eval'",
    );
  });

  it("names script origins instead of allowing any https host", () => {
    const sources = scriptSources(buildContentSecurityPolicy(false));

    expect(sources).not.toContain("https:");
    expect(sources).toContain("https://cloud.umami.is");
  });

  it("keeps framing, plugins and the base URI locked", () => {
    const policy = buildContentSecurityPolicy(false);

    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'self'");
  });
});
