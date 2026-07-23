import { z } from "zod";

import { acquisitionChannelSchema } from "@/lib/api/schemas/auth-user";

// Spans the three form tabs; Sigurnost is immediate actions and sits outside.
export const settingsFormSchema = z.object({
  username: z
    .string()
    .min(2, "Korisničko ime mora imati najmanje 2 znakova")
    .max(40, "Korisničko ime može imati najviše 40 znakova"),
  acquisitionChannel: acquisitionChannelSchema.nullable().optional(),
  notificationsPush: z.boolean(),
  notificationsEmail: z.boolean(),
  newsletter: z.boolean(),
  feedbackContact: z.boolean(),
  // Chain codes (storeApiId), never display names, matching the save path.
  pinnedStores: z.array(z.string()),
  // Place names double as their API ids.
  pinnedPlaces: z.array(z.string()),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export type SettingsSection = "profil" | "obavijesti" | "preference";

export const SECTION_FIELDS: Record<
  SettingsSection,
  (keyof SettingsFormValues)[]
> = {
  profil: ["username", "acquisitionChannel"],
  obavijesti: [
    "notificationsPush",
    "notificationsEmail",
    "newsletter",
    "feedbackContact",
  ],
  preference: ["pinnedStores", "pinnedPlaces"],
};

export const SETTINGS_DRAFT_KEY = "settings";
