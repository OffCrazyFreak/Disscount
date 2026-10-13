export const faqIds = [
  "source",
  "free",
  "stores",
  "account",
  "barcode",
  "offline",
] as const;

export type FaqId = (typeof faqIds)[number];
