import { z } from "zod";

import {
  acquisitionChannelSchema,
  usernameSchema,
} from "@/lib/api/schemas/auth-user";

// Equal to the backend's @Size on the bulk pin requests; the messages state 50 themselves.
const PINS_MAX = 50;

// Spans the three form tabs; Sigurnost is immediate actions and sits outside.
export const settingsFormSchema = z.object({
  username: usernameSchema,
  acquisitionChannel: acquisitionChannelSchema.nullable().optional(),
  notificationsPush: z.boolean(),
  notificationsEmail: z.boolean(),
  newsletter: z.boolean(),
  feedbackContact: z.boolean(),
  // Chain codes (storeApiId), never display names, matching the save path.
  pinnedStores: z
    .array(z.string())
    .max(PINS_MAX, "settings.validation.pinnedStoresMax"),
  // Place names double as their API ids.
  pinnedPlaces: z
    .array(z.string())
    .max(PINS_MAX, "settings.validation.pinnedPlacesMax"),
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
