import { z } from "zod";

// Digital Card schemas
export const digitalCardRequestSchema = z.object({
  title: z
    .string()
    .min(1, "Naziv je obavezan")
    .max(100, "Naziv može imati najviše 100 znakova"),
  value: z
    .string()
    .min(1, "Vrijednost je obavezna")
    .max(500, "Vrijednost može imati najviše 500 znakova"),
  type: z
    .string()
    .min(1, "Tip je obavezan")
    .max(50, "Tip može imati najviše 50 znakova"),
  codeType: z
    .string()
    .min(1, "Tip koda je obavezan")
    .max(50, "Tip koda može imati najviše 50 znakova"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Boja mora biti u HEX formatu (#ffffff)")
    .nullable()
    .optional(),
  note: z
    .string()
    .max(500, "Napomena može imati najviše 500 znakova")
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
