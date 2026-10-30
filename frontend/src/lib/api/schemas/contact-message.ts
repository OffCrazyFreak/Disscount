import { z } from "zod";

// What the public form submits. Email/name are optional; honeypot must stay empty.
export const contactMessageRequestSchema = z.object({
  email: z.email("common.validation.emailInvalid").or(z.literal("")).optional(),
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

// What the admin inbox reads back. Optional inputs relax to nullable.
export const contactMessageDtoSchema = contactMessageRequestSchema.extend({
  id: z.string(),
  userId: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  fullName: z.string().nullable().optional(),
  sourcePath: z.string().nullable().optional(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});

export type ContactMessageRequest = z.infer<typeof contactMessageRequestSchema>;
export type ContactMessageDto = z.infer<typeof contactMessageDtoSchema>;
