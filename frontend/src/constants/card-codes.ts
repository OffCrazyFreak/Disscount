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

export const CODE_TYPE_LABEL_KEYS: Record<
  CodeType,
  `digitalCards.codeTypes.${CodeType}`
> = {
  ean_13: "digitalCards.codeTypes.ean_13",
  ean_8: "digitalCards.codeTypes.ean_8",
  upc_a: "digitalCards.codeTypes.upc_a",
  upc_e: "digitalCards.codeTypes.upc_e",
  code_128: "digitalCards.codeTypes.code_128",
  code_39: "digitalCards.codeTypes.code_39",
  code_93: "digitalCards.codeTypes.code_93",
  codabar: "digitalCards.codeTypes.codabar",
  itf: "digitalCards.codeTypes.itf",
  qr_code: "digitalCards.codeTypes.qr_code",
  aztec: "digitalCards.codeTypes.aztec",
  data_matrix: "digitalCards.codeTypes.data_matrix",
  pdf417: "digitalCards.codeTypes.pdf417",
  unknown: "digitalCards.codeTypes.unknown",
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

export const CARD_TYPE_LABEL_KEYS: Record<
  CardType,
  `digitalCards.cardTypes.${CardType}`
> = {
  loyalty: "digitalCards.cardTypes.loyalty",
  gift: "digitalCards.cardTypes.gift",
  membership: "digitalCards.cardTypes.membership",
  other: "digitalCards.cardTypes.other",
};

export const CARD_PHOTO_SLOTS = ["front", "back", "icon"] as const;

export type CardPhotoSlot = (typeof CARD_PHOTO_SLOTS)[number];

export const CARD_PHOTO_SLOT_LABEL_KEYS: Record<
  CardPhotoSlot,
  `digitalCards.photos.slots.${CardPhotoSlot}`
> = {
  front: "digitalCards.photos.slots.front",
  back: "digitalCards.photos.slots.back",
  icon: "digitalCards.photos.slots.icon",
};
