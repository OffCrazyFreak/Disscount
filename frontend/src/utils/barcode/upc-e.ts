import { expandUpcE, gs1CheckDigit } from "@/utils/barcode/check-digits";

// Six digits (implied number system 0), seven (number system + six) or eight (with check
// digit) all become the eight digit form the renderer draws; anything else returns null.
export function toEightDigitUpcE(value: string): string | null {
  if (!/^\d{6,8}$/.test(value)) return null;

  const withSystem = value.length === 6 ? `0${value}` : value.slice(0, 7);
  if (withSystem[0] !== "0" && withSystem[0] !== "1") return null;

  if (value.length === 8) return value;

  // Expand to the 11 digit UPC-A body, whose check digit is the one UPC-E prints.
  const upcA = expandUpcE(`${withSystem}0`).slice(0, 11);

  return `${withSystem}${gs1CheckDigit(upcA)}`;
}
