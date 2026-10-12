import { z } from "zod";

import {
  CARD_PHOTO_SLOTS,
  CARD_TYPES,
  CODE_TYPES,
} from "@/constants/card-codes";

export const cardTypeSchema = z.enum(CARD_TYPES);
export const codeTypeSchema = z.enum(CODE_TYPES);
export const cardPhotoSlotSchema = z.enum(CARD_PHOTO_SLOTS);

const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Upiši datum u obliku GGGG-MM-DD")
  .nullable()
  .optional();

export const digitalCardRequestSchema = z
  .object({
    cardName: z
      .string()
      .trim()
      .min(2, "Upiši naziv s najmanje 2 znaka")
      .max(60, "Upiši naziv s najviše 60 znakova"),
    cardType: cardTypeSchema,
    storeName: z
      .string()
      .trim()
      .min(2, "Upiši trgovinu s najmanje 2 znaka")
      .max(60, "Upiši trgovinu s najviše 60 znakova"),
    chainCode: z
      .string()
      .regex(/^[a-z0-9_-]+$/)
      .max(40)
      .nullable()
      .optional(),
    codeValue: z
      .string()
      .trim()
      .min(1, "Upiši broj ili kod kartice")
      .max(4096, "Kod kartice je predug"),
    barcodeValue: z
      .string()
      .trim()
      .max(4096, "Kod je predug")
      .nullable()
      .optional(),
    codeType: codeTypeSchema,
    cardColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Odaberi boju"),
    note: z
      .string()
      .trim()
      .max(500, "Bilješka može imati najviše 500 znakova")
      .nullable()
      .optional(),
    validFrom: optionalDate,
    expiresOn: optionalDate,
    balance: z
      .number()
      .min(0, "Iznos ne može biti negativan")
      .max(1_000_000, "Iznos je prevelik")
      .nullable()
      .optional(),
    balanceUnit: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .nullable()
      .optional(),
  })
  .refine(
    (card) =>
      !card.validFrom || !card.expiresOn || card.expiresOn >= card.validFrom,
    { path: ["expiresOn"], message: "Kartica ne može isteći prije početka" },
  );

export const cardPhotoDtoSchema = z.object({
  slot: cardPhotoSlotSchema,
  sha256: z.string(),
});

// Its own object rather than an extension of the request schema, so a value the server
// accepted can never fail the form's stricter rules on the way back.
export const digitalCardDtoSchema = z.object({
  id: z.string(),
  cardName: z.string(),
  cardType: cardTypeSchema,
  storeName: z.string(),
  chainCode: z.string().nullable(),
  codeValue: z.string(),
  barcodeValue: z.string().nullable(),
  codeType: codeTypeSchema,
  cardColor: z.string(),
  note: z.string().nullable(),
  validFrom: z.string().nullable(),
  expiresOn: z.string().nullable(),
  balance: z.number().nullable(),
  balanceUnit: z.string().nullable(),
  pinnedAt: z.string().nullable(),
  lastUsedAt: z.string().nullable(),
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  photos: z.array(cardPhotoDtoSchema),
});

export const digitalCardsConfigSchema = z.object({
  photosEnabled: z.boolean(),
});

export type DigitalCardRequest = z.infer<typeof digitalCardRequestSchema>;
export type DigitalCardDto = z.infer<typeof digitalCardDtoSchema>;
export type CardPhotoDto = z.infer<typeof cardPhotoDtoSchema>;
export type DigitalCardsConfig = z.infer<typeof digitalCardsConfigSchema>;
