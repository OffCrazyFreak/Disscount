import { describe, expect, it } from "vitest";

import { formatPlainDate } from "@/utils/strings";

describe("formatPlainDate", () => {
  it("writes a Croatian date without leading zeros", () => {
    expect(formatPlainDate("2026-11-03T06:00:00Z", "hr")).toBe("3. 11. 2026.");
  });

  it("leaves the other languages to their usual format", () => {
    expect(formatPlainDate("2026-11-03T06:00:00Z", "de")).toBe("03.11.2026");
    expect(formatPlainDate("2026-11-03T06:00:00Z", "en")).toBe("3 Nov 2026");
  });
});
