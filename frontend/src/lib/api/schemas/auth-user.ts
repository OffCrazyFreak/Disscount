import { z } from "zod";

const PASSWORD_ERROR =
  "Lozinka mora imati barem 12 znakova i treba sadržavati najmanje jedno veliko slovo, jedno malo slovo te broj (0-9).";

// Shared rules for any newly created password (signup, set/change password).
// Not used for login, where any existing password must be accepted.
export const passwordSchema = z.string().refine(
  (value) =>
    value.length >= 12 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value),
  { message: PASSWORD_ERROR }
);

export const loginRequestSchema = z.object({
  email: z.email("Unesi važeći email"),
  password: z.string().min(1, "Unesi lozinku"),
});

export const registerRequestSchema = z
  .object({
    email: z.email("Unesi važeći email"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Lozinke se ne podudaraju",
    path: ["confirmPassword"],
  });

// Mirrors the backend AcquisitionChannel enum - granular per platform so marketing
// attribution can distinguish Instagram vs Facebook vs TikTok, etc.
export const acquisitionChannelSchema = z.enum([
  "GOOGLE_SEARCH",
  "INSTAGRAM",
  "FACEBOOK",
  "TIKTOK",
  "YOUTUBE",
  "FRIEND_OR_FAMILY",
  "ONLINE_AD",
  "BLOG_OR_NEWS",
  "APP_STORE",
  "POSTER_OR_FLYER",
  "EVENT",
  "OTHER",
]);

export const userRequestSchema = z.object({
  username: z
    .string()
    .min(2, "Korisničko ime mora imati najmanje 2 znakova")
    .max(40, "Korisničko ime može imati najviše 40 znakova")
    .nullable()
    .optional(),
  notificationsPush: z.boolean().optional(),
  notificationsEmail: z.boolean().optional(),
  newsletter: z.boolean().optional(),
  feedbackContact: z.boolean().optional(),
  acquisitionChannel: acquisitionChannelSchema.nullable().optional(),
  image: z.string().nullable().optional(),
  // "completed" or "skipped:<step>"; sent only when the onboarding wizard ends
  onboardingOutcome: z.string().optional(),
});

export const userDtoSchema = userRequestSchema
  .omit({
    notificationsPush: true,
    notificationsEmail: true,
    newsletter: true,
    feedbackContact: true,
  })
  .extend({
    id: z.string(),
    email: z.email().nullable().optional(),
    name: z.string().nullable().optional(),
    accountType: z.enum(["ADMIN", "CONSUMER", "ENTERPRISE", "PUBLIC_SECTOR"]),
    // Enable-timestamps (ISO strings); null = off. Drives the profile switches AND stats dashboards.
    notificationsPushEnabledAt: z.string().nullable().optional(),
    notificationsEmailEnabledAt: z.string().nullable().optional(),
    newsletterEnabledAt: z.string().nullable().optional(),
    feedbackContactEnabledAt: z.string().nullable().optional(),
    // null = onboarding wizard has never ended for this user -> auto-open it
    onboardingCompletedAt: z.string().nullable().optional(),
    onboardingOutcome: z.string().nullable().optional(),
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

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type UserRequest = z.infer<typeof userRequestSchema>;
export type UserDto = z.infer<typeof userDtoSchema>;

export type AccountType = UserDto["accountType"];

export type AcquisitionChannel = z.infer<typeof acquisitionChannelSchema>;

// Croatian display labels for account types
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  ADMIN: "Admin",
  CONSUMER: "Korisnik",
  ENTERPRISE: "Partner",
  PUBLIC_SECTOR: "Javni sektor",
};

// Croatian display labels for the "Kako si saznao za Disscount?" dropdown
export const ACQUISITION_CHANNEL_LABELS: Record<AcquisitionChannel, string> = {
  GOOGLE_SEARCH: "Google pretraga",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  FRIEND_OR_FAMILY: "Preporuka prijatelja ili obitelji",
  ONLINE_AD: "Online oglas",
  BLOG_OR_NEWS: "Blog, članak ili mediji",
  APP_STORE: "App Store / Google Play",
  POSTER_OR_FLYER: "Plakat ili letak",
  EVENT: "Sajam ili događaj",
  OTHER: "Ostalo",
};

const DASHBOARD_ACCOUNT_TYPES: AccountType[] = [
  "ADMIN",
  "ENTERPRISE",
  "PUBLIC_SECTOR",
];

export function canAccessDashboard(accountType?: AccountType | null): boolean {
  return !!accountType && DASHBOARD_ACCOUNT_TYPES.includes(accountType);
}

export function isAdmin(accountType?: AccountType | null): boolean {
  return accountType === "ADMIN";
}
