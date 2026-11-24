import type { CodeType } from "@/constants/card-codes";
import { hasValidCheckDigit } from "@/utils/barcode/check-digits";

export function getManualEntryError(
  trimmed: string,
  codeType: CodeType,
): "numberRequired" | "checkDigitMismatch" | null {
  if (trimmed === "") return "numberRequired";
  if (!hasValidCheckDigit(trimmed, codeType)) return "checkDigitMismatch";
  return null;
}
