import { describe, expect, it } from "vitest";

import { normalizeScannedCode } from "@/utils/barcode/normalize-code";
import { generateCodeSvg } from "@/app/(user)/digital-cards/utils/generate-code-svg";

function viewBox(svg: string): number[] {
  return /viewBox="([^"]+)"/.exec(svg)![1].split(" ").map(Number);
}

describe("generateCodeSvg", () => {
  it("draws a valid EAN-13 in module units", () => {
    const result = generateCodeSvg("5901234123457", "ean_13");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.twoDimensional).toBe(false);
    expect(result.svg).toContain('shape-rendering="crispEdges"');
    // 95 modules plus a 10 module quiet zone on each side.
    expect(viewBox(result.svg)[2]).toBeGreaterThanOrEqual(115);
  });

  it("fails on a bad check digit or wrong length", () => {
    expect(generateCodeSvg("5901234123458", "ean_13").ok).toBe(false);
    expect(generateCodeSvg("590123412345", "ean_13").ok).toBe(false);
  });

  it("scales matrix codes down to one unit per module", () => {
    const result = generateCodeSvg("hello", "qr_code");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.twoDimensional).toBe(true);
    // Version 1 QR is 21 modules, plus a 4 module quiet zone each side.
    expect(viewBox(result.svg)).toEqual([0, 0, 29, 29]);
  });

  it("fails for unknown and for characters the type cannot hold", () => {
    expect(generateCodeSvg("12345", "unknown").ok).toBe(false);
    expect(generateCodeSvg("abc", "code_39").ok).toBe(false);
    expect(generateCodeSvg("", "code_128").ok).toBe(false);
  });

  it("draws a scanned UPC-E in any accepted length, identically", () => {
    const svgs = ["425261", "0425261", "04252614"].map((rawValue) => {
      const { rawValue: value } = normalizeScannedCode({
        rawValue,
        format: "upc_e",
      });
      const result = generateCodeSvg(value, "upc_e");
      expect(result.ok).toBe(true);
      return result.ok ? result.svg : "";
    });

    expect(new Set(svgs).size).toBe(1);
  });

  it("draws already saved six and seven digit UPC-E values", () => {
    const eight = generateCodeSvg("04252614", "upc_e");

    for (const value of ["425261", "0425261"]) {
      expect(generateCodeSvg(value, "upc_e")).toEqual(eight);
    }
  });
});
