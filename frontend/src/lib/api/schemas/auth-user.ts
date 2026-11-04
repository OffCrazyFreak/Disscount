import { z } from "zod";

import { passwordSchema } from "@/lib/auth/password-policy";

/** The only outcome that satisfies the onboarding gate. */
export const ONBOARDING_COMPLETED = "completed";

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

export const usernameSchema = z
  .string()
  .min(2, "settings.validation.usernameMin")
  .max(40, "settings.validation.usernameMax");

export const userRequestSchema = z.object({
  username: usernameSchema.nullable().optional(),
  notificationsPush: z.boolean().optional(),
  notificationsEmail: z.boolean().optional(),
  newsletter: z.boolean().optional(),
  feedbackContact: z.boolean().optional(),
  acquisitionChannel: acquisitionChannelSchema.nullable().optional(),
  image: z.string().nullable().optional(),
  // At most three digits, as UserRequest.onboardingOutcome allows on the server.
  onboardingOutcome: z
    .union([
      z.literal(ONBOARDING_COMPLETED),
      z.string().regex(/^skipped:\d{1,3}$/),
    ])
    .optional(),
});

// Its own object, so the form's username limits never reject an account the server holds.
export const userDtoSchema = z.object({
  id: z.string(),
  username: z.string().nullable(),
  acquisitionChannel: acquisitionChannelSchema.nullable(),
  image: z.string().nullable(),
  email: z.string().nullable(),
  accountType: z.enum(["ADMIN", "CONSUMER", "ENTERPRISE", "PUBLIC_SECTOR"]),
  // Enable-timestamps (ISO strings); null = off. Drives the profile switches AND stats dashboards.
  notificationsPushEnabledAt: z.string().nullable(),
  notificationsEmailEnabledAt: z.string().nullable(),
  newsletterEnabledAt: z.string().nullable(),
  feedbackContactEnabledAt: z.string().nullable(),
  // Skipped outcomes stay incomplete even though they have a completion timestamp.
  onboardingCompletedAt: z.string().nullable(),
  onboardingOutcome: z.string().nullable(),
  createdAt: z.string(),
  // Admin list only; derived from the better-auth session rows.
  lastLoginAt: z.string().nullable(),
  // Present on every UserDto, and what the active-user counters read.
  lastActiveAt: z.string().nullable(),
  // Not on the wire: the client fills these from the session and the preferences endpoints.
  name: z.string().nullable().optional(),
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

// Message keys in the "auth" namespace; consumers translate them with t().
export const ACCOUNT_TYPE_LABELS = {
  ADMIN: "accountTypes.ADMIN",
  CONSUMER: "accountTypes.CONSUMER",
  ENTERPRISE: "accountTypes.ENTERPRISE",
  PUBLIC_SECTOR: "accountTypes.PUBLIC_SECTOR",
} as const satisfies Record<AccountType, string>;

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
