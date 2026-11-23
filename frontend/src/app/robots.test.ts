import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import { appUrl } from "@/lib/env";

describe("robots", () => {
  it("points crawlers at the sitemap index alone", () => {
    expect(robots().sitemap).toBe(`${appUrl()}/sitemap-index.xml`);
  });

  it("keeps private pages out in every locale", () => {
    const { rules } = robots();
    const disallow = Array.isArray(rules) ? [] : rules.disallow;

    expect(disallow).toEqual(
      expect.arrayContaining(["/watchlist", "/en/watchlist", "/api/"]),
    );
    expect(disallow).not.toContain("/shopping-lists");
  });
});
