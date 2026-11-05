import { describe, expect, it } from "vitest";

import { formatPrice, formatPriceDelta } from "@/utils/price";

// Intl separates the amount and symbol with a no-break space; compare as plain spaces.
function plain(text: string) {
  return text.replace(/\s/g, " ");
}

describe("formatPrice", () => {
  it("uses each locale's separators and symbol position, always in euros", () => {
    expect(plain(formatPrice(1234.5, "hr"))).toBe("1.234,50 €");
    expect(plain(formatPrice(1234.5, "de"))).toBe("1.234,50 €");
    expect(formatPrice(1234.5, "en")).toBe("€1,234.50");
  });

  it("formats an unknown locale as Croatian rather than throwing", () => {
    expect(plain(formatPrice(2, "fr"))).toBe("2,00 €");
  });
});

describe("formatPriceDelta", () => {
  it("signs rises and drops and rounds the percentage", () => {
    expect(plain(formatPriceDelta(0.25, 12.4, "hr"))).toBe("+0,25 € (12%)");
    expect(plain(formatPriceDelta(-0.3, -7.6, "hr"))).toBe("−0,30 € (8%)");
    expect(formatPriceDelta(-0.3, -7.6, "en")).toBe("-€0.30 (8%)");
  });

  it("leaves no change unsigned", () => {
    expect(plain(formatPriceDelta(0, 0, "hr"))).toBe("0,00 € (0%)");
  });
});
