import { describe, expect, it } from "vitest";
import { hasValidCheckDigit } from "@/utils/barcode/check-digits";

describe("hasValidCheckDigit", () => {
  it("accepts real EAN-13 codes and rejects a flipped digit", () => {
    expect(hasValidCheckDigit("4006381333931", "ean_13")).toBe(true);
    expect(hasValidCheckDigit("5901234123457", "ean_13")).toBe(true);
    expect(hasValidCheckDigit("4006381333932", "ean_13")).toBe(false);
    expect(hasValidCheckDigit("4006381333391", "ean_13")).toBe(false);
  });

  it("checks EAN-8", () => {
    expect(hasValidCheckDigit("96385074", "ean_8")).toBe(true);
    expect(hasValidCheckDigit("73513537", "ean_8")).toBe(true);
    expect(hasValidCheckDigit("96385075", "ean_8")).toBe(false);
  });

  it("checks UPC-A", () => {
    expect(hasValidCheckDigit("036000291452", "upc_a")).toBe(true);
    expect(hasValidCheckDigit("036000291453", "upc_a")).toBe(false);
  });

  it("rejects wrong lengths and non-digits for fixed formats", () => {
    expect(hasValidCheckDigit("400638133393", "ean_13")).toBe(false);
    expect(hasValidCheckDigit("40063813339311", "ean_13")).toBe(false);
    expect(hasValidCheckDigit("9638507", "ean_8")).toBe(false);
    expect(hasValidCheckDigit("4006381333A31", "ean_13")).toBe(false);
  });

  it("expands UPC-E to UPC-A before checking", () => {
    expect(hasValidCheckDigit("04252614", "upc_e")).toBe(true);
    expect(hasValidCheckDigit("04252615", "upc_e")).toBe(false);
    expect(hasValidCheckDigit("01234565", "upc_e")).toBe(true);
    expect(hasValidCheckDigit("01234567", "upc_e")).toBe(false);
  });

  it("accepts UPC-E without a check digit and rejects other lengths", () => {
    expect(hasValidCheckDigit("425261", "upc_e")).toBe(true);
    expect(hasValidCheckDigit("0425261", "upc_e")).toBe(true);
    expect(hasValidCheckDigit("42526", "upc_e")).toBe(false);
    expect(hasValidCheckDigit("204252614", "upc_e")).toBe(false);
    expect(hasValidCheckDigit("24252614", "upc_e")).toBe(false);
  });

  it("checks ITF only at 14 digits", () => {
    expect(hasValidCheckDigit("10012345678902", "itf")).toBe(true);
    expect(hasValidCheckDigit("10012345678903", "itf")).toBe(false);
    expect(hasValidCheckDigit("123456", "itf")).toBe(true);
  });

  it("passes formats without a mandatory check digit", () => {
    expect(hasValidCheckDigit("ABC-123", "code_128")).toBe(true);
    expect(hasValidCheckDigit("https://x.test", "qr_code")).toBe(true);
    expect(hasValidCheckDigit("123", "code_39")).toBe(true);
  });
});
