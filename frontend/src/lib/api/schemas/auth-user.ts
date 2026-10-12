import { z } from "zod";

const PASSWORD_ERROR = "auth.validation.passwordRules";

/** The only outcome that satisfies the onboarding gate. */
export const ONBOARDING_COMPLETED = "completed";

// New passwords only: login must still accept any existing password.
export const passwordSchema = z
  .string()
  .refine(
    (value) =>
      value.length >= 12 &&
      /[A-Z]/.test(value) &&
      /[a-z]/.test(value) &&
      /[0-9]/.test(value),
    { message: PASSWORD_ERROR },
  );

export const loginRequestSchema = z.object({
  email: z.email("auth.validation.emailInvalid"),
  password: z.string().min(1, "auth.validation.passwordRequired"),
});

export const registerRequestSchema = z
  .object({
    email: z.email("auth.validation.emailInvalid"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "auth.validation.passwordsMismatch",
    path: ["confirmPassword"],
  });

// Mirrors the backend AcquisitionChannel enum, per platform for attribution.
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
    .min(2, "auth.validation.usernameMin")
    .max(40, "auth.validation.usernameMax")
    .nullable()
    .optional(),
  notificationsPush: z.boolean().optional(),
  notificationsEmail: z.boolean().optional(),
  newsletter: z.boolean().optional(),
  feedbackContact: z.boolean().optional(),
  acquisitionChannel: acquisitionChannelSchema.nullable().optional(),
  image: z.string().nullable().optional(),
  // "completed" or "skipped:<step>"; sent only when the onboarding wizard ends
  onboardingOutcome: z
    .union([z.literal(ONBOARDING_COMPLETED), z.string().regex(/^skipped:\d+$/)])
    .optional(),
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
    // Only a completed outcome satisfies the onboarding gate. Historical skipped
    // outcomes remain incomplete even though they have a completion timestamp.
    onboardingCompletedAt: z.string().nullable().optional(),
    onboardingOutcome: z.string().nullable().optional(),
    createdAt: z.string(),
    // Admin list only; derived from the better-auth session rows.
    lastLoginAt: z.string().nullable().optional(),
    // Present on every UserDto, and what the active-user counters read.
    lastActiveAt: z.string().nullable().optional(),
    pinnedStores: z
      .array(
        z.object({
          id: z.string(),
          userId: z.string(),
          storeApiId: z.string(),
          storeName: z.string(),
        }),
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
        }),
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

// Message keys in the "auth" namespace; consumers translate them with t().
export const ACCOUNT_TYPE_LABELS = {
  ADMIN: "accountTypes.ADMIN",
  CONSUMER: "accountTypes.CONSUMER",
  ENTERPRISE: "accountTypes.ENTERPRISE",
  PUBLIC_SECTOR: "accountTypes.PUBLIC_SECTOR",
} as const satisfies Record<AccountType, string>;

// Message keys in the "auth" namespace for the "Odakle znaš za Disscount?" dropdown.
export const ACQUISITION_CHANNEL_LABELS = {
  GOOGLE_SEARCH: "acquisitionChannels.GOOGLE_SEARCH",
  INSTAGRAM: "acquisitionChannels.INSTAGRAM",
  FACEBOOK: "acquisitionChannels.FACEBOOK",
  TIKTOK: "acquisitionChannels.TIKTOK",
  YOUTUBE: "acquisitionChannels.YOUTUBE",
  FRIEND_OR_FAMILY: "acquisitionChannels.FRIEND_OR_FAMILY",
  ONLINE_AD: "acquisitionChannels.ONLINE_AD",
  BLOG_OR_NEWS: "acquisitionChannels.BLOG_OR_NEWS",
  APP_STORE: "acquisitionChannels.APP_STORE",
  POSTER_OR_FLYER: "acquisitionChannels.POSTER_OR_FLYER",
  EVENT: "acquisitionChannels.EVENT",
  OTHER: "acquisitionChannels.OTHER",
} as const satisfies Record<AcquisitionChannel, string>;

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
