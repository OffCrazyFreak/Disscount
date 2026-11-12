import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { APIError } from "better-auth/api";

import { auth } from "@/lib/auth";
import { parseAccountBody } from "@/lib/auth/parse-account-body";
import { REAUTH_REQUIRED } from "@/lib/auth/security-policy";
import { db } from "@/db";
import { account } from "@/db/auth-schema";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/locales";
import { localePath } from "@/i18n/locale-path";

const bodySchema = z.object({
  newEmail: z.email(),
});

// Blocks the change while a social account is linked, so provider login cannot later carry a different email.
export async function POST(request: Request) {
  const parsed = await parseAccountBody(request, bodySchema);
  if (parsed.response) return parsed.response;

  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const linkedSocial = await db
    .select({ id: account.id })
    .from(account)
    .where(
      and(
        eq(account.userId, session.user.id),
        ne(account.providerId, "credential"),
      ),
    )
    .limit(1);

  if (linkedSocial.length > 0) {
    return NextResponse.json({ error: "social_linked" }, { status: 409 });
  }

  try {
    // Confirmation goes to the CURRENT address; the change applies once clicked.
    await auth.api.changeEmail({
      body: {
        newEmail: parsed.data.newEmail.toLowerCase(),
        callbackURL: localePath(
          isLocale(session.user.locale) ? session.user.locale : DEFAULT_LOCALE,
          "/?modal=email-changed",
        ),
      },
      headers: requestHeaders,
    });
  } catch (error) {
    // The auth hook asks for a session the current password renewed in the last 15 minutes.
    if (error instanceof APIError && error.body?.code === REAUTH_REQUIRED) {
      return NextResponse.json({ error: REAUTH_REQUIRED }, { status: 403 });
    }
    return NextResponse.json({ error: "change_email_failed" }, { status: 500 });
  }

  return NextResponse.json({ status: true });
}
