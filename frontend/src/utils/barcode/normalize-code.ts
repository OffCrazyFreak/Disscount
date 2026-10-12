import { toEightDigitUpcE } from "@/utils/barcode/upc-e";
import type { IScannedCode } from "@/typings/scanned-code";

// A UPC-A is an EAN-13 with a leading zero, and EAN-13 is what product lookups
// and the barcode renderer expect.
export function normalizeScannedCode(code: IScannedCode): IScannedCode {
  const rawValue = code.rawValue.trim();

  if (code.format === "upc_a" && /^\d{12}$/.test(rawValue)) {
    return { format: "ean_13", rawValue: `0${rawValue}` };
  }

  if (code.format === "upc_e") {
    const full = toEightDigitUpcE(rawValue);
    if (full) return { ...code, rawValue: full };
  }

  return { ...code, rawValue };
}
