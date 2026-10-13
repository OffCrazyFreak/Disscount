// Code types use the BarcodeDetector format names, so a scan needs no translation on the
// way in, plus "unknown" for a membership number that has no barcode at all.
export const CODE_TYPES = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "code_93",
  "codabar",
  "itf",
  "qr_code",
  "aztec",
  "data_matrix",
  "pdf417",
  "unknown",
] as const;

export type CodeType = (typeof CODE_TYPES)[number];

export const CODE_TYPE_LABELS: Record<CodeType, string> = {
  ean_13: "EAN-13",
  ean_8: "EAN-8",
  upc_a: "UPC-A",
  upc_e: "UPC-E",
  code_128: "Code 128",
  code_39: "Code 39",
  code_93: "Code 93",
  codabar: "Codabar",
  itf: "ITF",
  qr_code: "QR kod",
  aztec: "Aztec",
  data_matrix: "Data Matrix",
  pdf417: "PDF417",
  unknown: "Samo broj/tekst",
};

export const TWO_DIMENSIONAL_CODE_TYPES: readonly CodeType[] = [
  "qr_code",
  "aztec",
  "data_matrix",
  "pdf417",
];

export function isCodeType(value: string): value is CodeType {
  return (CODE_TYPES as readonly string[]).includes(value);
}

export const CARD_TYPES = ["loyalty", "gift", "membership", "other"] as const;

export type CardType = (typeof CARD_TYPES)[number];

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  loyalty: "Kartica vjernosti",
  gift: "Poklon kartica",
  membership: "Članska kartica",
  other: "Ostalo",
};

export const CARD_PHOTO_SLOTS = ["front", "back", "icon"] as const;

export type CardPhotoSlot = (typeof CARD_PHOTO_SLOTS)[number];

export const CARD_PHOTO_SLOT_LABELS: Record<CardPhotoSlot, string> = {
  front: "Prednja strana",
  back: "Stražnja strana",
  icon: "Ikona",
};
