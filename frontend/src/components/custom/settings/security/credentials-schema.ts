import { z } from "zod";

import { passwordSchema } from "@/lib/api/schemas/auth-user";

// The rules depend on whether a password exists, so the schema is built per state.
export function buildCredentialsSchema(hasPassword: boolean) {
  return z
    .object({
      email: z.email("Unesi važeći email"),
      newPassword: z.string(),
      currentPassword: z.string(),
    })
    .superRefine((data, ctx) => {
      // Social-only accounts must set a password; password accounts may leave it blank.
      if (!hasPassword || data.newPassword.length > 0) {
        const result = passwordSchema.safeParse(data.newPassword);
        if (!result.success) {
          ctx.addIssue({
            code: "custom",
            path: ["newPassword"],
            message: result.error.issues[0].message,
          });
        }
      }

      if (hasPassword && !data.currentPassword) {
        ctx.addIssue({
          code: "custom",
          path: ["currentPassword"],
          message: "Unesi trenutnu lozinku",
        });
      }
    });
}

export type CredentialsFormValues = z.infer<
  ReturnType<typeof buildCredentialsSchema>
>;
