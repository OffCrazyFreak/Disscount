import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { APIError } from "better-auth/api";

import { auth } from "@/lib/auth";
import {
  clearPasswordAttempts,
  reservePasswordAttempt,
} from "@/lib/auth/password-attempt-limit";
import { db } from "@/db";
import { account } from "@/db/auth-schema";

const bodySchema = z.object({
  newEmail: z.email(),
  currentPassword: z.string().min(1),
});

// Enforces the single-email identity invariant: block the change while a social
// account is linked, so provider login can't later carry a different email.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  // Checked here, not by a client sign-in: that would create a session and trip the
  // breached-password refusal on what is only a confirmation.
  const userId = session.user.id;
  if (!reservePasswordAttempt(userId)) {
    return NextResponse.json({ error: "too_many_attempts" }, { status: 429 });
  }

  try {
    await auth.api.verifyPassword({
      body: { password: parsed.data.currentPassword },
      headers: requestHeaders,
    });
    clearPasswordAttempts(userId);
  } catch (error) {
    if (error instanceof APIError && error.body?.code === "INVALID_PASSWORD") {
      return NextResponse.json({ error: "invalid_password" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to verify password" },
      { status: 500 },
    );
  }

  try {
    // Confirmation goes to the CURRENT address; the change applies once clicked.
    await auth.api.changeEmail({
      body: {
        newEmail: parsed.data.newEmail.toLowerCase(),
        callbackURL: "/?modal=email-changed",
      },
      headers: requestHeaders,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to change email" },
      { status: 500 },
    );
  }

  return NextResponse.json({ status: true });
}
