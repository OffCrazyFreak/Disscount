import { z } from "zod";

import { CARD_TYPES, CODE_TYPES } from "@/constants/card-codes";

export const digitalCardRequestSchema = z.object({
  cardName: z
    .string()
    .trim()
    .min(2, "Upiši naziv kartice s najmanje 2 znaka")
    .max(60, "Upiši naziv kartice s najviše 60 znakova"),
  cardType: z.enum(CARD_TYPES, { message: "Odaberi tip kartice" }),
  storeName: z
    .string()
    .trim()
    .min(2, "Upiši naziv trgovine s najmanje 2 znaka")
    .max(60, "Upiši naziv trgovine s najviše 60 znakova"),
  chainCode: z.string().max(40).nullable(),
  codeValue: z
    .string()
    .trim()
    .min(1, "Unesi ili skeniraj kod kartice")
    .max(4096, "Kod kartice je predug"),
  codeType: z.enum(CODE_TYPES, { message: "Odaberi tip koda" }),
  cardColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Neispravna boja kartice"),
  iconImage: z.string().max(400_000, "Ikona je prevelika").nullable(),
  frontImage: z
    .string()
    .max(1_200_000, "Slika prednje strane je prevelika")
    .nullable(),
  backImage: z
    .string()
    .max(1_200_000, "Slika stražnje strane je prevelika")
    .nullable(),
  note: z
    .string()
    .trim()
    .max(500, "Upiši bilješku s najviše 500 znakova")
    .nullable(),
});

// The three images live outside react-hook-form (see use-card-images.ts), so the form
// validates a narrower shape and the submit hook merges them back in.
export const digitalCardFormSchema = digitalCardRequestSchema.omit({
  iconImage: true,
  frontImage: true,
  backImage: true,
});

export const digitalCardDtoSchema = digitalCardRequestSchema.extend({
  id: z.string(),
  userId: z.string(),
  pinnedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type DigitalCardRequest = z.infer<typeof digitalCardRequestSchema>;
export type DigitalCardFormData = z.infer<typeof digitalCardFormSchema>;
export type DigitalCardDto = z.infer<typeof digitalCardDtoSchema>;
