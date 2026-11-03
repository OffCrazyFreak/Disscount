import { describe, expect, it } from "vitest";

import { localeFromPath, localePath } from "@/i18n/locale-path";

describe("localePath", () => {
  it("leaves Croatian paths bare", () => {
    expect(localePath("hr", "/products?q=mlijeko")).toBe("/products?q=mlijeko");
  });

  it("prefixes other locales and keeps the query and hash", () => {
    expect(localePath("en", "/products?q=milk#top")).toBe(
      "/en/products?q=milk#top",
    );
    expect(localePath("de", "/reset-password?token=abc")).toBe(
      "/de/reset-password?token=abc",
    );
  });

  it("turns the home page into the bare prefix", () => {
    expect(localePath("sl", "/")).toBe("/sl");
    expect(localePath("it", "/?modal=install")).toBe("/it?modal=install");
  });
});

describe("localeFromPath", () => {
  it("reads a locale prefix", () => {
    expect(localeFromPath("/en/products")).toBe("en");
    expect(localeFromPath("/de")).toBe("de");
  });

  it("falls back to Croatian for bare and unknown paths", () => {
    expect(localeFromPath("/")).toBe("hr");
    expect(localeFromPath("/products/123")).toBe("hr");
    expect(localeFromPath("/english/products")).toBe("hr");
  });
});
