import { z } from "zod";

export const contactMessageRequestSchema = z.object({
  email: z.email("auth.validation.emailInvalid").or(z.literal("")).optional(),
  fullName: z.string().max(255, "common.validation.fullNameMax").optional(),
  subject: z
    .string()
    .min(1, "common.validation.subjectRequired")
    .max(255, "common.validation.subjectMax"),
  message: z
    .string()
    .min(1, "common.validation.messageRequired")
    .max(5000, "common.validation.messageMax"),
  sourcePath: z.string().optional(),
  // Honeypot must stay empty; reject a filled value (backend also drops it server-side).
  honeypot: z.string().max(0).optional(),
});

// Its own object, so the form's length and format rules never reject a message the server already stored.
export const contactMessageDtoSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  email: z.string().nullable(),
  fullName: z.string().nullable(),
  subject: z.string(),
  message: z.string(),
  sourcePath: z.string().nullable(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});

export type ContactMessageRequest = z.infer<typeof contactMessageRequestSchema>;
export type ContactMessageDto = z.infer<typeof contactMessageDtoSchema>;
