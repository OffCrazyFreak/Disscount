import { z } from "zod";

// Auth schemas
export const loginRequestSchema = z.object({
  usernameOrEmail: z
    .string()
    .min(2, { message: "Korisničko ime ili email mora imati najmanje 2 znaka" })
    .refine(
      (value) =>
        value.includes("@")
          ? z.email().safeParse(value).success
          : value.length >= 2 && value.length <= 40,
      "Nevažeće korisničko ime ili email"
    ),
  password: z
    .string()
    .min(12, { message: "Lozinka mora imati najmanje 12 znakova" })
    .max(40, { message: "Lozinka može imati najviše 40 znakova" })
    .refine((password) => /[A-Z]/.test(password), {
      message: "Lozinka mora sadržavati barem jedno veliko slovo",
    })
    .refine((password) => /[a-z]/.test(password), {
      message: "Lozinka mora sadržavati barem jedno malo slovo",
    })
    .refine((password) => /[0-9]/.test(password), {
      message: "Lozinka mora sadržavati barem jedan broj",
    })
    .refine((password) => /[!@#$%^&*]/.test(password), {
      message:
        "Lozinka mora sadržavati barem jedan specijalni znak (npr. !@#$%^&*)",
    }),
});

export const registerRequestSchema = z
  .object({
    username: z
      .string()
      .min(2, "Korisničko ime mora imati najmanje 2 znakova")
      .max(40, "Korisničko ime može imati najviše 40 znakova")
      .optional(),
    email: z.email("Unesi važeći email"),
    password: z
      .string()
      .min(12, { message: "Lozinka mora imati najmanje 12 znakova" })
      .max(40, { message: "Lozinka može imati najviše 40 znakova" })
      .refine((password) => /[A-Z]/.test(password), {
        message: "Lozinka mora sadržavati barem jedno veliko slovo",
      })
      .refine((password) => /[a-z]/.test(password), {
        message: "Lozinka mora sadržavati barem jedno malo slovo",
      })
      .refine((password) => /[0-9]/.test(password), {
        message: "Lozinka mora sadržavati barem jedan broj",
      })
      .refine((password) => /[!@#$%^&*]/.test(password), {
        message:
          "Lozinka mora sadržavati barem jedan specijalni znak (npr. !@#$%^&*)",
      }),
    confirmPassword: z.string(),
    stayLoggedInDays: z.number().min(0).optional(),
    notificationsPush: z.boolean().optional(),
    notificationsEmail: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Lozinke se ne podudaraju",
    path: ["confirmPassword"],
  });

// User schemas
export const userRequestSchema = z.object({
  username: z
    .string()
    .min(2, "Korisničko ime mora imati najmanje 2 znakova")
    .max(40, "Korisničko ime može imati najviše 40 znakova")
    .optional(),
  stayLoggedInDays: z.number().min(0).optional(),
  notificationsPush: z.boolean().optional(),
  notificationsEmail: z.boolean().optional(),
});

export const userDtoSchema = userRequestSchema.extend({
  id: z.string(),
  email: z.email(),
  lastLoginAt: z.string(),
  subscriptionTier: z.enum(["FREE", "PRO"]),
  subscriptionStartDate: z.string().optional(),
  numberOfAiPrompts: z.number(),
  lastAiPromptAt: z.string().optional(),
  createdAt: z.string(),
});

// Type exports
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type UserRequest = z.infer<typeof userRequestSchema>;
export type UserDto = z.infer<typeof userDtoSchema>;
