import type { CodeType } from "@/constants/card-codes";
import { hasValidCheckDigit } from "@/utils/barcode/check-digits";

const CODE_39_CHARSET = /^[A-Z0-9 \-.$/+%]+$/;
const PRINTABLE_ASCII = /^[\x20-\x7e]+$/;

function validTypesFor(value: string): CodeType[] {
  const isDigits = /^\d+$/.test(value);
  const code128 = PRINTABLE_ASCII.test(value);
  const code39 = CODE_39_CHARSET.test(value);
  const types: CodeType[] = [];

  if (isDigits && value.length === 13 && hasValidCheckDigit(value, "ean_13"))
    types.push("ean_13");
  if (isDigits && value.length === 8 && hasValidCheckDigit(value, "ean_8"))
    types.push("ean_8");

  if (code128) types.push("code_128");

  // Plain numbers try Code 39 before QR; text goes to QR first, since Code 39 is wide.
  if (isDigits) {
    if (code39) types.push("code_39");
    types.push("qr_code");
  } else {
    types.push("qr_code");
    if (code39) types.push("code_39");
  }

  return types;
}

/**
 * Other code types that can carry the value, in the order "Ne skenira se?" cycles them:
 * the full ordered list rotated to start just after `current`, with `current` left out.
 */
export function codeTypeAlternatives(
  value: string,
  current: CodeType,
): CodeType[] {
  const all = validTypesFor(value);
  const at = all.indexOf(current);
  const rotated = at === -1 ? all : [...all.slice(at + 1), ...all.slice(0, at)];

  return rotated.filter((type) => type !== current);
}
