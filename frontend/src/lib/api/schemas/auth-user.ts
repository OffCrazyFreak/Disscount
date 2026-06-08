import { z } from "zod";

// Auth schemas — better-auth uses email + password. Credential strength is
// enforced by better-auth on the server (minPasswordLength); we keep light
// client-side checks for UX.
export const loginRequestSchema = z.object({
  email: z.email("Unesi važeći email"),
  password: z.string().min(1, { message: "Lozinka je obavezna" }),
});

export const registerRequestSchema = z
  .object({
    name: z
      .string()
      .min(2, "Ime mora imati najmanje 2 znaka")
      .max(60, "Ime može imati najviše 60 znakova"),
    email: z.email("Unesi važeći email"),
    password: z
      .string()
      .min(8, { message: "Lozinka mora imati najmanje 8 znakova" })
      .max(128, { message: "Lozinka može imati najviše 128 znakova" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Lozinke se ne podudaraju",
    path: ["confirmPassword"],
  });

// Profile update schema — business fields owned by the Spring backend.
export const userRequestSchema = z.object({
  username: z
    .string()
    .min(2, "Korisničko ime mora imati najmanje 2 znakova")
    .max(40, "Korisničko ime može imati najviše 40 znakova")
    .nullable()
    .optional(),
  notificationsPush: z.boolean().optional(),
  notificationsEmail: z.boolean().optional(),
});

export const userDtoSchema = userRequestSchema.extend({
  id: z.string(),
  email: z.email(),
  // Display identity comes from the better-auth session and is merged in
  // client-side (the backend profile does not store name/image).
  name: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  subscriptionTier: z.enum(["FREE", "PRO"]),
  subscriptionStartDate: z.string().nullable().optional(),
  numberOfAiPrompts: z.number(),
  lastAiPromptAt: z.string().nullable().optional(),
  createdAt: z.string(),
  pinnedStores: z
    .array(
      z.object({
        id: z.string(),
        userId: z.string(),
        storeApiId: z.string(),
        storeName: z.string(),
      })
    )
    .nullable()
    .optional(),
  pinnedPlaces: z
    .array(
      z.object({
        id: z.string(),
        userId: z.string(),
        placeApiId: z.string(),
        placeName: z.string(),
      })
    )
    .nullable()
    .optional(),
});

// Type exports
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type UserRequest = z.infer<typeof userRequestSchema>;
export type UserDto = z.infer<typeof userDtoSchema>;
