import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import proxy from "@/proxy";
import { LOCALES } from "@/i18n/locales";

const ORIGIN = "https://disscount.me";

function run(path: string) {
  return proxy(new NextRequest(new URL(path, ORIGIN)));
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

    expect(response.status).toBe(200);
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
