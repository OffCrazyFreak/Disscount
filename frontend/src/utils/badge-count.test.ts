import { describe, expect, it } from "vitest";

import { formatBadgeCount } from "@/utils/badge-count";

describe("formatBadgeCount", () => {
  it("shows the exact count up to nine and caps it above", () => {
    expect(formatBadgeCount(1)).toBe("1");
    expect(formatBadgeCount(9)).toBe("9");
    expect(formatBadgeCount(10)).toBe("9+");
  });
});
