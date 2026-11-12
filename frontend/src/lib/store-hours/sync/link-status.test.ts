import { describe, expect, it } from "vitest";

import { linksByHost, linkStatusOf } from "@/lib/store-hours/sync/link-status";

describe("linkStatusOf", () => {
  it("calls a page broken only when the site says it is gone", () => {
    expect(linkStatusOf(404)).toBe("broken");
    expect(linkStatusOf(410)).toBe("broken");
  });

  it("accepts success and redirects", () => {
    expect(linkStatusOf(200)).toBe("ok");
    expect(linkStatusOf(301)).toBe("ok");
  });

  it("leaves bot walls, rate limits, outages and network errors unverified", () => {
    for (const status of [403, 429, 500, 503, null]) {
      expect(linkStatusOf(status)).toBe("unverified");
    }
  });
});

describe("linksByHost", () => {
  it("groups links by host", () => {
    expect(
      linksByHost([
        "https://www.lidl.hr/s/1",
        "https://www.konzum.hr/a",
        "https://www.lidl.hr/s/2",
      ]),
    ).toEqual([
      ["https://www.lidl.hr/s/1", "https://www.lidl.hr/s/2"],
      ["https://www.konzum.hr/a"],
    ]);
  });
});
