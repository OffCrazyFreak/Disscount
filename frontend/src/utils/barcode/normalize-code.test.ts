import { describe, expect, it } from "vitest";
import { normalizeScannedCode } from "@/utils/barcode/normalize-code";

describe("normalizeScannedCode", () => {
  it("turns a 12 digit UPC-A into an EAN-13 with a leading zero", () => {
    expect(
      normalizeScannedCode({ rawValue: "036000291452", format: "upc_a" }),
    ).toEqual({ rawValue: "0036000291452", format: "ean_13" });
  });

  it("leaves other formats alone and trims whitespace", () => {
    expect(
      normalizeScannedCode({ rawValue: " 4006381333931\n", format: "ean_13" }),
    ).toEqual({ rawValue: "4006381333931", format: "ean_13" });
    expect(
      normalizeScannedCode({ rawValue: "ABC 1", format: "code_128" }),
    ).toEqual({ rawValue: "ABC 1", format: "code_128" });
  });

  it("does not touch a malformed upc_a", () => {
    expect(
      normalizeScannedCode({ rawValue: "0360002914", format: "upc_a" }),
    ).toEqual({ rawValue: "0360002914", format: "upc_a" });
  });

  it("normalizes 6, 7 and 8 digit UPC-E to the same 8 digit value", () => {
    for (const rawValue of ["425261", "0425261", "04252614"]) {
      expect(normalizeScannedCode({ rawValue, format: "upc_e" })).toEqual({
        rawValue: "04252614",
        format: "upc_e",
      });
    }
    expect(
      normalizeScannedCode({ rawValue: "123456", format: "upc_e" }).rawValue,
    ).toBe("01234565");
  });

  it("leaves an invalid UPC-E alone", () => {
    expect(
      normalizeScannedCode({ rawValue: "2425261", format: "upc_e" }).rawValue,
    ).toBe("2425261");
    expect(
      normalizeScannedCode({ rawValue: "42526", format: "upc_e" }).rawValue,
    ).toBe("42526");
  });
});
