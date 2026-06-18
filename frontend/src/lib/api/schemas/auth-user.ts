import { z } from "zod";

const passwordSchema = z.string().min(8, { message: "Lozinka mora imati najmanje 8 znakova" });

export const loginRequestSchema = z.object({
  email: z.email("Unesi važeći email"),
  password: passwordSchema,
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

export const userRequestSchema = z.object({
  username: z
    .string()
    .min(2, "Korisničko ime mora imati najmanje 2 znakova")
    .max(40, "Korisničko ime može imati najviše 40 znakova")
    .nullable()
    .optional(),
  notificationsPush: z.boolean().optional(),
  notificationsEmail: z.boolean().optional(),
  image: z.string().nullable().optional(),
});

export const userDtoSchema = userRequestSchema.extend({
  id: z.string(),
  email: z.email().nullable().optional(),
  name: z.string().nullable().optional(),
  accountType: z.enum(["ADMIN", "CONSUMER", "ENTERPRISE", "PUBLIC_SECTOR"]),
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

// Croatian display labels for account types
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  ADMIN: "Admin",
  CONSUMER: "Korisnik",
  ENTERPRISE: "Partner",
  PUBLIC_SECTOR: "Javni sektor",
};

const DASHBOARD_ACCOUNT_TYPES: AccountType[] = [
  "ADMIN",
  "ENTERPRISE",
  "PUBLIC_SECTOR",
];

export function canAccessDashboard(accountType?: AccountType | null): boolean {
  return !!accountType && DASHBOARD_ACCOUNT_TYPES.includes(accountType);
}
