import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { parseAccountBody } from "@/lib/auth/parse-account-body";
import { db } from "@/db";
import { user as userTable } from "@/db/auth-schema";
import { requireEnv } from "@/lib/env";
import { passwordSchema } from "@/lib/auth/password-policy";
import { rejectUnacceptablePassword } from "@/lib/auth/password-rejection";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/locales";
import { localePath } from "@/i18n/locale-path";

const BETTER_AUTH_URL = requireEnv("BETTER_AUTH_URL");

const registerSchema = z.object({
  email: z.email(),
  password: passwordSchema,
  // The page language at signup becomes the account language, which picks the
  // language of the verification email.
  locale: z.enum(LOCALES).catch(DEFAULT_LOCALE),
});

// Always responds identically so existence never leaks: a new email gets a normal
// sign-up (and verification email), an existing account gets a reset link (which also
// links a credential for OAuth-only users). The client only ever sees a neutral notice.
export async function POST(request: Request) {
  const parsed = await parseAccountBody(request, registerSchema);
  if (parsed.response) return parsed.response;

  // Before the account lookup, so the verdict depends on the password alone and can't
  // reveal whether the address is registered.
  const rejection = await rejectUnacceptablePassword(parsed.data.password);
  if (rejection) return rejection;

  // Better Auth normalizes stored emails to lowercase, so match on the lowercased input.
  const email = parsed.data.email.toLowerCase();
  const { locale } = parsed.data;

  try {
    const existing = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.email, email))
      .limit(1);

    if (existing.length > 0) {
      await auth.api.requestPasswordReset({
        body: {
          email,
          // No email in the URL: it would leak via history, Referer and logs.
          redirectTo: `${BETTER_AUTH_URL}${localePath(locale, "/reset-password")}`,
        },
      });
    } else {
      await auth.api.signUpEmail({
        body: {
          email,
          password: parsed.data.password,
          name: email.split("@")[0],
          locale,
          // Better Auth signs them in en route to this success modal.
          callbackURL: localePath(locale, "/?modal=email-verified"),
        },
      });
    }
  } catch (error) {
    // Swallowed for anti-enumeration; the raw error could carry email or password.
    console.error(
      "Registration handler failed:",
      error instanceof Error ? error.name : typeof error,
    );
  }

  return NextResponse.json({ status: true });
}
