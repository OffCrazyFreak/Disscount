import type { CodeType } from "@/constants/card-codes";
import { hasValidCheckDigit } from "@/utils/barcode/check-digits";

/** The scanner.manual message key for what is wrong with a typed code, if anything. */
export function getManualEntryError(
  trimmed: string,
  codeType: CodeType,
): "numberRequired" | "checkDigitMismatch" | null {
  if (trimmed === "") return "numberRequired";
  if (!hasValidCheckDigit(trimmed, codeType)) return "checkDigitMismatch";
  return null;
}
