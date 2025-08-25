import { z } from "zod";

export const userDetailsSchema = z.object({
  username: z
    .string()
    .min(2, "Korisničko ime mora imati najmanje 2 znakova")
    .max(40, "Korisničko ime može imati najviše 40 znakova"),
  avatar: z.instanceof(File).nullable(),
  stayLoggedInDays: z.number().min(0).optional(),
  notificationsPush: z.boolean().optional(),
  notificationsEmail: z.boolean().optional(),
});

export const userPreferencesSchema = z.object({
  pinnedStores: z.array(z.string()),
  pinnedPlaces: z.array(z.string()),
});

export type UserDetailsFormType = z.infer<typeof userDetailsSchema>;
export type UserPreferencesFormType = z.infer<typeof userPreferencesSchema>;
