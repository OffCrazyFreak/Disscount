import { z } from "zod";

// Digital Card schemas
export const digitalCardRequestSchema = z.object({
  title: z
    .string()
    .min(1, "digitalCards.validation.titleRequired")
    .max(100, "digitalCards.validation.titleMax"),
  value: z
    .string()
    .min(1, "digitalCards.validation.valueRequired")
    .max(500, "digitalCards.validation.valueMax"),
  type: z
    .string()
    .min(1, "digitalCards.validation.typeRequired")
    .max(50, "digitalCards.validation.typeMax"),
  codeType: z
    .string()
    .min(1, "digitalCards.validation.codeTypeRequired")
    .max(50, "digitalCards.validation.codeTypeMax"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "digitalCards.validation.colorHex")
    .nullable()
    .optional(),
  note: z
    .string()
    .max(500, "digitalCards.validation.noteMax")
    .nullable()
    .optional(),
});

// DTO schema extends request schema
export const digitalCardDtoSchema = digitalCardRequestSchema.extend({
  id: z.string(),
  createdAt: z.string(),
});

// Type exports
export type DigitalCardRequest = z.infer<typeof digitalCardRequestSchema>;
export type DigitalCardDto = z.infer<typeof digitalCardDtoSchema>;
