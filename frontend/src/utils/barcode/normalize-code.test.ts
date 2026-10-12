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
});
