import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { parseAccountBody } from "@/lib/auth/parse-account-body";
import { passwordSchema } from "@/lib/auth/password-policy";
import { rejectUnacceptablePassword } from "@/lib/auth/password-rejection";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/locales";
import { localePath } from "@/i18n/locale-path";

const registerSchema = z.object({
  email: z.email(),
  password: passwordSchema,
  // The page language at signup becomes the account language, which picks the language of the verification email.
  locale: z.enum(LOCALES).catch(DEFAULT_LOCALE),
});

// Always responds identically so existence never leaks: better-auth mails the owner of a registered address instead.
export async function POST(request: Request) {
  const parsed = await parseAccountBody(request, registerSchema);
  if (parsed.response) return parsed.response;

  // Before sign-up, so the verdict cannot reveal whether the address is registered.
  const rejection = await rejectUnacceptablePassword(parsed.data.password);
  if (rejection) return rejection;

  const email = parsed.data.email.toLowerCase();
  const { locale } = parsed.data;

  try {
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
  } catch (error) {
    // Swallowed for anti-enumeration; the raw error could carry email or password.
    console.error(
      "Registration handler failed:",
      error instanceof Error ? error.name : typeof error,
    );
  }

  return NextResponse.json({ status: true });
}
