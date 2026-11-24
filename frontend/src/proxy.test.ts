import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import proxy from "@/proxy";
import { LOCALE_COOKIE, LOCALES } from "@/i18n/locales";

const ORIGIN = "https://disscount.me";

function run(path: string, cookie?: string) {
  const headers = cookie ? { cookie } : undefined;

  return proxy(new NextRequest(new URL(path, ORIGIN), { headers }));
}

function rewrittenPath(response: Response): string | null {
  const target = response.headers.get("x-middleware-rewrite");

  return target ? new URL(target).pathname : null;
}

describe("proxy share images", () => {
  it.each(
    LOCALES.flatMap((locale) =>
      ["opengraph-image", "twitter-image"].map(
        (image) => `/${locale}/${image}/brand?4737ad00d3f5ad33`,
      ),
    ),
  )("serves %s without a redirect", (path) => {
    const response = run(path);

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("location")).toBeNull();
  });

  it("still redirects a prefixed Croatian page to its bare URL", () => {
    const response = run("/hr/statistics");

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe(
      "/statistics",
    );
  });
});

describe("proxy product ids", () => {
  it("answers a broken percent escape with a bare 404", () => {
    const response = run("/products/%E0%A4%A");

    expect(response.status).toBe(404);
    expect(rewrittenPath(response)).toBeNull();
  });

  it.each([
    ["/products/not-a-barcode", "/hr/404"],
    ["/en/products/123", "/en/404"],
    ["/de/products/abc/", "/de/404"],
  ])("rewrites the malformed id %s to %s with a 404", (path, target) => {
    const response = run(path);

    expect(response.status).toBe(404);
    expect(rewrittenPath(response)).toBe(target);
  });

  it("hands a well-formed Croatian id on to next-intl", () => {
    const response = run("/products/3850104123456");

    expect(response.status).toBe(200);
    expect(rewrittenPath(response)).toBe("/hr/products/3850104123456");
  });

  it("hands a well-formed prefixed id on to next-intl", () => {
    const response = run("/en/products/konzum:12345");

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});

describe("proxy saved locale", () => {
  it("redirects the bare root to the saved language", () => {
    const response = run("/", `${LOCALE_COOKIE}=en`);

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe(
      "/en",
    );
  });

  it.each([
    ["the default language", `${LOCALE_COOKIE}=hr`],
    ["an unknown language", `${LOCALE_COOKIE}=xx`],
    ["no cookie", undefined],
  ])("keeps the bare root in place for %s", (_, cookie) => {
    const response = run("/", cookie);

    expect(response.headers.get("location")).toBeNull();
  });

  it("leaves every other path in its own language", () => {
    const response = run("/statistics", `${LOCALE_COOKIE}=en`);

    expect(response.headers.get("location")).toBeNull();
  });
});
