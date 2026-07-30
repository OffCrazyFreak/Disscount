import type { BarcodeFormat } from "barcode-detector";

// Stored codeType vocabulary: the Barcode Detection API's own format names, which is
// exactly what the scanner hands back, so a scan needs no translation on the way in.
export const SCANNABLE_CODE_TYPES = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "code_93",
  "itf",
  "codabar",
  "qr_code",
  "data_matrix",
  "pdf417",
  "aztec",
] as const satisfies readonly BarcodeFormat[];

// "unknown" is the escape hatch for a code we cannot draw: a membership number, or a
// value the chosen symbology rejects. The card then prints the value large instead.
export const CODE_TYPES = [...SCANNABLE_CODE_TYPES, "unknown"] as const;

export type CodeType = (typeof CODE_TYPES)[number];

export const CARD_TYPES = ["loyalty", "gift", "membership", "other"] as const;

export type CardType = (typeof CARD_TYPES)[number];
